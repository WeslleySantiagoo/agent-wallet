import uuid
from datetime import date, datetime
from typing import List
from sqlalchemy.orm import Session
from app.db.models import CreditCard, Invoice, InvoiceStatus, Transaction, TransactionType, Account
from app.schemas.schemas import CreditCardCreate, TransactionCreate

def getOrCreateInvoice(db: Session, credit_card_id: int, target_date: date) -> Invoice:
    """
    Encontra ou cria a fatura para uma determinada data de transação no cartão.
    Lógica de fechamento: se o dia da transação é maior que o closing_day, pertence à fatura do próximo mês.
    """
    card = db.query(CreditCard).filter(CreditCard.id == credit_card_id).first()
    if not card:
        raise ValueError("Cartão de crédito não encontrado")

    month = target_date.month
    year = target_date.year

    if target_date.day > card.closing_day:
        month += 1
        if month > 12:
            month = 1
            year += 1

    invoice = db.query(Invoice).filter(
        Invoice.credit_card_id == credit_card_id,
        Invoice.month == month,
        Invoice.year == year
    ).first()

    if not invoice:
        invoice = Invoice(
            credit_card_id=credit_card_id,
            month=month,
            year=year,
            status=InvoiceStatus.OPEN,
            total_amount=0.0
        )
        db.add(invoice)
        db.flush()

    return invoice

def processCardPurchase(db: Session, tx_data: TransactionCreate) -> List[Transaction]:
    """
    Processa compra no cartão de crédito (à vista ou parcelada).
    - Compra parcelada: compromete o limite total imediatamente (used_limit += total_amount).
    - Cria parcelas futuras divididas igualmente, alocando na fatura correspondente.
    """
    card = db.query(CreditCard).filter(CreditCard.id == tx_data.credit_card_id).first()
    if not card:
        raise ValueError("Cartão de crédito não encontrado")

    total_installments = tx_data.total_installments if tx_data.is_installment and tx_data.total_installments else 1
    total_amount = tx_data.amount
    installment_amount = round(total_amount / total_installments, 2)
    group_id = str(uuid.uuid4()) if total_installments > 1 else None

    # Compromete o limite total imediatamente
    card.used_limit += total_amount

    created_transactions = []
    base_date = tx_data.date or date.today()

    for i in range(total_installments):
        # Calcular mês de cada parcela
        current_month = base_date.month + i
        current_year = base_date.year + (current_month - 1) // 12
        actual_month = ((current_month - 1) % 12) + 1
        
        # Manter o mesmo dia da compra (ajustando se o mês tiver menos dias)
        day = min(base_date.day, 28)
        parcel_date = date(current_year, actual_month, day)

        invoice = getOrCreateInvoice(db, card.id, parcel_date)
        invoice.total_amount += installment_amount

        desc = tx_data.description
        if total_installments > 1:
            desc = f"{tx_data.description} ({i+1}/{total_installments})"

        tx = Transaction(
            credit_card_id=card.id,
            invoice_id=invoice.id,
            category_id=tx_data.category_id,
            amount=installment_amount,
            description=desc,
            type=TransactionType.CARD_PURCHASE,
            date=parcel_date,
            is_installment=total_installments > 1,
            installment_number=i + 1 if total_installments > 1 else None,
            total_installments=total_installments if total_installments > 1 else None,
            installment_group_id=group_id
        )
        db.add(tx)
        created_transactions.append(tx)

    db.commit()
    for tx in created_transactions:
        db.refresh(tx)
    return created_transactions

def payInvoice(db: Session, credit_card_id: int, invoice_id: int, account_id: int) -> Invoice:
    """
    Paga uma fatura do cartão:
    1. Debita o valor total da fatura da conta selecionada.
    2. Libera o limite do cartão referente a essa fatura.
    3. Marca a fatura como PAID.
    """
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.credit_card_id == credit_card_id
    ).first()

    if not invoice:
        raise ValueError("Fatura não encontrada")
    if invoice.status == InvoiceStatus.PAID:
        raise ValueError("Fatura já está paga")

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise ValueError("Conta bancária para pagamento não encontrada")

    card = db.query(CreditCard).filter(CreditCard.id == credit_card_id).first()

    # 1. Debita saldo da conta
    account.balance -= invoice.total_amount

    # 2. Libera limite no cartão
    card.used_limit = max(0.0, card.used_limit - invoice.total_amount)

    # 3. Atualiza fatura
    invoice.status = InvoiceStatus.PAID
    invoice.paid_at = datetime.utcnow()

    # 4. Registra transação de saída na conta referente ao pagamento da fatura
    tx_payment = Transaction(
        account_id=account.id,
        amount=invoice.total_amount,
        description=f"Pagamento Fatura {card.name} ({invoice.month}/{invoice.year})",
        type=TransactionType.EXPENSE,
        date=date.today()
    )
    db.add(tx_payment)

    db.commit()
    db.refresh(invoice)
    return invoice

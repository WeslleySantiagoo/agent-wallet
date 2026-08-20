from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from app.db.models import Transaction, TransactionType, Account, Category, CreditCard
from app.schemas.schemas import TransactionCreate
from app.services.credit_card_service import processCardPurchase

def createTransaction(db: Session, tx_in: TransactionCreate):
    # Se for compra no cartão de crédito
    if tx_in.type == TransactionType.CARD_PURCHASE or tx_in.credit_card_id is not None:
        if not tx_in.credit_card_id:
            raise ValueError("ID do cartão de crédito é obrigatório para compras com cartão")
        tx_in.type = TransactionType.CARD_PURCHASE
        return processCardPurchase(db, tx_in)

    # Transações de Conta Corrente/Poupança (débito/crédito direto)
    if not tx_in.account_id:
        raise ValueError("ID da conta é obrigatório para transações diretas")

    account = db.query(Account).filter(Account.id == tx_in.account_id).first()
    if not account:
        raise ValueError("Conta não encontrada")

    tx = Transaction(
        account_id=tx_in.account_id,
        category_id=tx_in.category_id,
        amount=tx_in.amount,
        description=tx_in.description,
        type=tx_in.type,
        date=tx_in.date or date.today()
    )

    if tx_in.type == TransactionType.INCOME:
        account.balance += tx_in.amount
    elif tx_in.type in [TransactionType.EXPENSE, TransactionType.TRANSFER]:
        account.balance -= tx_in.amount

    db.add(tx)
    db.commit()
    db.refresh(tx)
    return [tx]

def getTransactions(db: Session, limit: int = 100, offset: int = 0):
    return db.query(Transaction).order_by(Transaction.date.desc(), Transaction.id.desc()).offset(offset).limit(limit).all()

def deleteTransaction(db: Session, tx_id: int):
    tx = db.query(Transaction).filter(Transaction.id == tx_id).first()
    if not tx:
        return False

    # Se a transação estiver ligada a uma conta, estorna o valor no saldo
    if tx.account_id:
        account = db.query(Account).filter(Account.id == tx.account_id).first()
        if account:
            if tx.type == TransactionType.INCOME:
                account.balance -= tx.amount
            elif tx.type in [TransactionType.EXPENSE, TransactionType.TRANSFER]:
                account.balance += tx.amount

    db.delete(tx)
    db.commit()
    return True

def getDashboardSummary(db: Session):
    today = date.today()
    
    # 1. Total Balance em todas as contas
    accounts = db.query(Account).all()
    total_balance = sum(a.balance for a in accounts)

    # 2. Despesas e Receitas do Mês Atual
    monthly_txs = db.query(Transaction).filter(
        extract('month', Transaction.date) == today.month,
        extract('year', Transaction.date) == today.year
    ).all()

    total_monthly_expenses = sum(
        tx.amount for tx in monthly_txs if tx.type in [TransactionType.EXPENSE, TransactionType.CARD_PURCHASE]
    )
    total_monthly_income = sum(
        tx.amount for tx in monthly_txs if tx.type == TransactionType.INCOME
    )
    net_cash_flow = total_monthly_income - total_monthly_expenses

    # 3. Contagem
    active_accounts_count = len(accounts)
    active_cards_count = db.query(CreditCard).count()
    active_installments_count = db.query(Transaction).filter(Transaction.is_installment == True).count()

    # 4. Últimas 10 transações
    recent_transactions = db.query(Transaction).order_by(Transaction.date.desc(), Transaction.id.desc()).limit(10).all()

    # 5. Gastos por Categoria no mês
    cat_query = db.query(
        Category.name,
        Category.color,
        func.sum(Transaction.amount).label("total")
    ).join(Transaction, Transaction.category_id == Category.id)\
     .filter(
        extract('month', Transaction.date) == today.month,
        extract('year', Transaction.date) == today.year,
        Transaction.type.in_([TransactionType.EXPENSE, TransactionType.CARD_PURCHASE])
    ).group_by(Category.id).all()

    categories_breakdown = [
        {"name": row.name, "color": row.color or "#697565", "total": float(row.total)}
        for row in cat_query
    ]

    return {
        "total_balance": total_balance,
        "total_monthly_expenses": total_monthly_expenses,
        "total_monthly_income": total_monthly_income,
        "net_cash_flow": net_cash_flow,
        "active_accounts_count": active_accounts_count,
        "active_cards_count": active_cards_count,
        "active_installments_count": active_installments_count,
        "recent_transactions": recent_transactions,
        "categories_breakdown": categories_breakdown
    }

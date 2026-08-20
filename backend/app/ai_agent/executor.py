from sqlalchemy.orm import Session
from typing import Dict, Any, Tuple, Optional
from app.db.models import Account, CreditCard, TransactionType, AccountType
from app.schemas.schemas import TransactionCreate, AccountCreate
from app.services import transaction_service, credit_card_service, account_service
from app.ai_agent.strategy import ChartData

def executeToolCall(db: Session, tool_name: str, args: Dict[str, Any]) -> Tuple[Dict[str, Any], Optional[ChartData]]:
    """
    Executa a tool chamada pela IA no banco de dados e retorna o resultado + gráfico (se houver).
    """
    chart_output = None

    if tool_name == "cadastrar_conta":
        name = args.get("nome", "Nova Conta")
        institution = args.get("instituicao", name)
        saldo_inicial = float(args.get("saldo_inicial", 0.0))
        acc_type_str = str(args.get("tipo", "CHECKING")).upper()
        acc_type = AccountType.CHECKING
        if acc_type_str in AccountType.__members__:
            acc_type = AccountType[acc_type_str]

        account_in = AccountCreate(
            name=name,
            institution=institution,
            balance=saldo_inicial,
            type=acc_type
        )
        account = account_service.createAccount(db, account_in)
        return {
            "status": "success",
            "tool": tool_name,
            "message": f"Conta '{account.name}' ({account.institution or 'Banco'}) cadastrada com sucesso com saldo inicial de R$ {account.balance:.2f}.",
            "account_id": account.id
        }, None

    elif tool_name in ["registrar_despesa", "registrar_receita"]:
        account_id = args.get("account_id")
        account = db.query(Account).filter(Account.id == account_id).first() if account_id else None
        if not account:
            account = db.query(Account).first()
            if not account:
                account = Account(name="Conta Principal", balance=0.0)
                db.add(account)
                db.commit()
                db.refresh(account)
            account_id = account.id

        tx_type = TransactionType.INCOME if tool_name == "registrar_receita" else TransactionType.EXPENSE
        desc = args.get("descricao", "Lançamento via IA")
        val = float(args.get("valor", 0.0))

        tx_in = TransactionCreate(
            description=desc,
            amount=val,
            type=tx_type,
            account_id=account_id,
            category_id=args.get("category_id")
        )
        txs = transaction_service.createTransaction(db, tx_in)
        action_verb = "Receita" if tool_name == "registrar_receita" else "Despesa"
        return {
            "status": "success",
            "tool": tool_name,
            "message": f"{action_verb} de R$ {val:.2f} ('{desc}') registrada com sucesso na conta '{account.name}'.",
            "transaction_id": txs[0].id
        }, None

    elif tool_name == "registrar_compra_cartao_parcelada":
        card_id = args.get("credit_card_id")
        card = db.query(CreditCard).filter(CreditCard.id == card_id).first() if card_id else None
        if not card:
            card = db.query(CreditCard).first()
            if not card:
                account = db.query(Account).first()
                if not account:
                    account = Account(name="Conta Principal", balance=1000.0)
                    db.add(account)
                    db.commit()
                    db.refresh(account)
                card = CreditCard(
                    account_id=account.id,
                    name="Cartão Principal",
                    total_limit=5000.0,
                    closing_day=25,
                    due_day=5
                )
                db.add(card)
                db.commit()
                db.refresh(card)
            card_id = card.id

        desc = args.get("descricao", "Compra no cartão")
        val = float(args.get("valor_total", 0.0))
        parcelas = int(args.get("parcelas", 1))

        tx_in = TransactionCreate(
            description=desc,
            amount=val,
            type=TransactionType.CARD_PURCHASE,
            credit_card_id=card_id,
            is_installment=parcelas > 1,
            total_installments=parcelas,
            category_id=args.get("category_id")
        )
        txs = transaction_service.createTransaction(db, tx_in)
        return {
            "status": "success",
            "tool": tool_name,
            "message": f"Compra de R$ {val:.2f} parcelada em {parcelas}x registrada no cartão '{card.name}'.",
            "transactions_count": len(txs)
        }, None

    elif tool_name == "pagar_fatura":
        card_id = args.get("credit_card_id")
        invoice_id = args.get("invoice_id")
        account_id = args.get("account_id")

        if not account_id:
            account = db.query(Account).first()
            account_id = account.id if account else 1

        invoice = credit_card_service.payInvoice(
            db,
            credit_card_id=card_id,
            invoice_id=invoice_id,
            account_id=account_id
        )
        return {
            "status": "success",
            "tool": tool_name,
            "message": f"Fatura {invoice.month}/{invoice.year} de R$ {invoice.total_amount:.2f} paga com sucesso.",
            "invoice_id": invoice.id
        }, None

    elif tool_name == "gerar_grafico":
        chart_output = ChartData(
            chart_type=args.get("tipo", "bar"),
            title=args.get("titulo", "Gráfico Gerado"),
            data=args.get("data", []),
            x_key=args.get("x_key", "categoria"),
            y_keys=args.get("y_keys", ["valor"])
        )
        return {
            "status": "success",
            "tool": tool_name,
            "message": f"Gráfico '{args.get('titulo')}' gerado com sucesso."
        }, chart_output

    else:
        return {"status": "error", "message": f"Tool '{tool_name}' não suportada"}, None

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

    # 3. Cartões de Crédito e Limite Reais
    credit_cards = db.query(CreditCard).all()
    active_accounts_count = len(accounts)
    active_cards_count = len(credit_cards)
    total_credit_limit = sum(c.total_limit for c in credit_cards)
    used_credit_limit = sum(c.used_limit for c in credit_cards)

    primary_card = None
    if credit_cards:
        c = credit_cards[0]
        primary_card = {
            "name": c.name,
            "last_four_digits": c.last_four_digits or "0000",
            "used_limit": c.used_limit,
            "total_limit": c.total_limit,
            "due_day": c.due_day,
            "closing_day": c.closing_day
        }

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

    # 6. Evolução Mensal Real (últimos 6 meses)
    monthly_evolution = []
    month_names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    
    for i in range(5, -1, -1):
        m = today.month - i
        y = today.year
        while m <= 0:
            m += 12
            y -= 1
        
        m_txs = db.query(Transaction).filter(
            extract('month', Transaction.date) == m,
            extract('year', Transaction.date) == y
        ).all()
        
        m_rec = sum(tx.amount for tx in m_txs if tx.type == TransactionType.INCOME)
        m_desp = sum(tx.amount for tx in m_txs if tx.type in [TransactionType.EXPENSE, TransactionType.CARD_PURCHASE])
        
        monthly_evolution.append({
            "mes": month_names[m - 1],
            "Receitas": float(m_rec),
            "Despesas": float(m_desp)
        })

    # 7. Saldo Diário dos últimos 60 dias (para o Sparkline)
    from datetime import timedelta
    daily_balance_60_days = []
    
    # Pega todas as transações de conta (INCOME/EXPENSE) dos últimos 60 dias e também do futuro (caso existam)
    sixty_days_ago = today - timedelta(days=59)
    txs_after_60 = db.query(Transaction).filter(
        Transaction.date >= sixty_days_ago,
        Transaction.account_id.isnot(None),
        Transaction.type.in_([TransactionType.INCOME, TransactionType.EXPENSE])
    ).all()
    
    # Agrupa o net flow por dia
    from collections import defaultdict
    flows_by_day = defaultdict(float)
    for tx in txs_after_60:
        if tx.type == TransactionType.INCOME:
            flows_by_day[tx.date] += tx.amount
        elif tx.type == TransactionType.EXPENSE:
            flows_by_day[tx.date] -= tx.amount

    current_simulated_balance = float(total_balance)
    
    # Transações no futuro que já estão no saldo atual devem ser subtraídas para chegar ao saldo de hoje
    future_txs = [tx for tx in txs_after_60 if tx.date > today]
    for tx in future_txs:
        if tx.type == TransactionType.INCOME:
            current_simulated_balance -= tx.amount
        elif tx.type == TransactionType.EXPENSE:
            current_simulated_balance += tx.amount
            
    # Agora current_simulated_balance é o saldo ao final do dia de 'today'
    # Vamos caminhar de today até today-59 dias
    # Para o dia D, seu saldo final é current_simulated_balance.
    # O saldo final de D-1 será saldo de D menos o fluxo de D.
    
    daily_balances_dict = {}
    temp_balance = current_simulated_balance
    
    for i in range(60):
        d = today - timedelta(days=i)
        daily_balances_dict[d] = temp_balance
        # Para o dia anterior, desfazemos o fluxo do dia atual
        temp_balance -= flows_by_day[d]
        
    for i in range(59, -1, -1):
        d = today - timedelta(days=i)
        daily_balance_60_days.append({
            "date": d.isoformat(),
            "day": d.day,
            "month": d.month,
            "val": float(daily_balances_dict[d])
        })

    return {
        "total_balance": total_balance,
        "total_monthly_expenses": total_monthly_expenses,
        "total_monthly_income": total_monthly_income,
        "net_cash_flow": net_cash_flow,
        "active_accounts_count": active_accounts_count,
        "active_cards_count": active_cards_count,
        "total_credit_limit": total_credit_limit,
        "used_credit_limit": used_credit_limit,
        "primary_card": primary_card,
        "active_installments_count": active_installments_count,
        "recent_transactions": recent_transactions,
        "categories_breakdown": categories_breakdown,
        "monthly_evolution": monthly_evolution,
        "daily_balance_60_days": daily_balance_60_days
    }

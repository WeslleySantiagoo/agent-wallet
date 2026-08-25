import sys
import os

with open("backend/app/services/transaction_service.py", "r") as f:
    content = f.read()

replacement = """    # 7. Saldo Diário dos últimos 60 dias (para o Sparkline)
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
        "total_balance": total_balance,"""

content = content.replace('    return {\n        "total_balance": total_balance,', replacement)

with open("backend/app/services/transaction_service.py", "w") as f:
    f.write(content)


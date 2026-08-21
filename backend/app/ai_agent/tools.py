from typing import List, Dict, Any

AI_TOOLS_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "name": "cadastrar_conta",
        "description": "Cadastra uma nova conta bancária ou instituição financeira (ex: Mercado Pago, Itaú, Nubank, Bradesco).",
        "parameters": {
            "type": "object",
            "properties": {
                "nome": {"type": "string", "description": "Nome da conta ou banco (ex: Mercado Pago, Itaú)"},
                "instituicao": {"type": "string", "description": "Nome da instituição financeira. Opcional."},
                "saldo_inicial": {"type": "number", "description": "Saldo inicial ou de nivelamento. Padrão 0.0 se omitido."},
                "tipo": {"type": "string", "enum": ["CHECKING", "SAVINGS", "INVESTMENT"], "description": "Tipo da conta. Padrão CHECKING."}
            },
            "required": ["nome"]
        }
    },
    {
        "name": "registrar_despesa",
        "description": "Registra uma despesa ou compra direta na conta bancária.",
        "parameters": {
            "type": "object",
            "properties": {
                "descricao": {"type": "string", "description": "Descrição da despesa"},
                "valor": {"type": "number", "description": "Valor total da despesa"},
                "account_id": {"type": "integer", "description": "ID da conta bancária. Opcional, padrão 1 se omitido."},
                "category_id": {"type": "integer", "description": "ID da categoria. Opcional."}
            },
            "required": ["descricao", "valor"]
        }
    },
    {
        "name": "registrar_compra_cartao_parcelada",
        "description": "Registra compra no cartão de crédito compromete o limite total e aloca parcelas futuras nas faturas.",
        "parameters": {
            "type": "object",
            "properties": {
                "descricao": {"type": "string", "description": "Descrição da compra"},
                "valor_total": {"type": "number", "description": "Valor total da compra"},
                "parcelas": {"type": "integer", "description": "Número total de parcelas (ex: 10)"},
                "credit_card_id": {"type": "integer", "description": "ID do cartão de crédito. Opcional, padrão 1 se omitido."},
                "category_id": {"type": "integer", "description": "ID da categoria. Opcional."}
            },
            "required": ["descricao", "valor_total", "parcelas"]
        }
    },
    {
        "name": "registrar_receita",
        "description": "Registra uma receita ou entrada de dinheiro em uma conta bancária.",
        "parameters": {
            "type": "object",
            "properties": {
                "descricao": {"type": "string", "description": "Descrição da receita"},
                "valor": {"type": "number", "description": "Valor recebido"},
                "account_id": {"type": "integer", "description": "ID da conta bancária."}
            },
            "required": ["descricao", "valor"]
        }
    },
    {
        "name": "pagar_fatura",
        "description": "Realiza o pagamento de uma fatura de cartão de crédito descontando da conta bancária.",
        "parameters": {
            "type": "object",
            "properties": {
                "credit_card_id": {"type": "integer", "description": "ID do cartão"},
                "invoice_id": {"type": "integer", "description": "ID da fatura"},
                "account_id": {"type": "integer", "description": "ID da conta bancária pagadora"}
            },
            "required": ["credit_card_id", "invoice_id", "account_id"]
        }
    },
    {
        "name": "gerar_grafico",
        "description": "Gera um gráfico visual para ser exibido diretamente na conversa com o usuário.",
        "parameters": {
            "type": "object",
            "properties": {
                "tipo": {"type": "string", "enum": ["bar", "line", "pie", "area"], "description": "Tipo do gráfico"},
                "titulo": {"type": "string", "description": "Título explicativo do gráfico"},
                "x_key": {"type": "string", "description": "Chave do eixo X (ex: 'categoria', 'mes')"},
                "y_keys": {"type": "array", "items": {"type": "string"}, "description": "Chaves das séries Y (ex: ['valor'])"},
                "data": {
                    "type": "array",
                    "items": {"type": "object"},
                    "description": "Array de objetos com os dados a serem plotados"
                }
            },
            "required": ["tipo", "titulo", "x_key", "y_keys", "data"]
        }
    }
]

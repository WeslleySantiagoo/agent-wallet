import os
import shutil
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import engine, Base, getDb
from app.db.models import Transaction, CreditCard, Invoice, Account, Category, ChatMessage, ChatSession, AIUsage
from app.api.categories import seed_categories_if_needed

router = APIRouter(tags=["Database Import/Export"])

class ResetOptions(BaseModel):
    reset_all: Optional[bool] = True
    targets: Optional[List[str]] = []

@router.get("/export")
def exportDatabase():
    """Download do arquivo SQLite financas.db"""
    db_path = os.path.join(settings.DATA_DIR, settings.DB_NAME)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Banco de dados não encontrado")
    return FileResponse(
        path=db_path,
        filename="financas_backup.db",
        media_type="application/octet-stream"
    )

@router.post("/import")
def importDatabase(file: UploadFile = File(...)):
    """Sobrescreve o arquivo SQLite financas.db com o banco importado pelo usuário"""
    if not file.filename.endswith(".db"):
        raise HTTPException(status_code=400, detail="O arquivo precisa ter a extensão .db")

    db_path = os.path.join(settings.DATA_DIR, settings.DB_NAME)
    
    # Dispose active connections before replacing database file
    engine.dispose()

    try:
        with open(db_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"status": "success", "message": "Banco de dados importado com sucesso."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao importar banco de dados: {str(e)}")

@router.post("/reset")
def resetDatabase(options: Optional[ResetOptions] = None, db: Session = Depends(getDb)):
    """
    Reseta o banco de dados.
    Se reset_all=True ou nenhum target for informado, limpa todas as tabelas recriando-as.
    Se targets for informado (ex: ["transactions", "credit_cards", "accounts", "categories", "chat_history"]),
    apaga seletivamente as entidades selecionadas.
    """
    try:
        if not options or options.reset_all or not options.targets or len(options.targets) >= 5:
            engine.dispose()
            Base.metadata.drop_all(bind=engine)
            Base.metadata.create_all(bind=engine)
            seed_categories_if_needed(db)
            return {"status": "success", "message": "Banco de dados totalmente resetado com sucesso."}

        targets = set(options.targets)

        # 1. Seletivo de Transações
        if "transactions" in targets and "credit_cards" not in targets and "accounts" not in targets:
            db.query(Transaction).delete()
            for card in db.query(CreditCard).all():
                card.used_limit = 0.0

        # 2. Seletivo de Cartões de Crédito (e suas faturas/transações de cartão)
        if "credit_cards" in targets:
            db.query(Transaction).filter(Transaction.credit_card_id.isnot(None)).delete()
            db.query(Invoice).delete()
            db.query(CreditCard).delete()

        # 3. Seletivo de Contas Bancárias (e suas transações/cartões vinculados)
        if "accounts" in targets:
            db.query(Transaction).filter(Transaction.account_id.isnot(None)).delete()
            db.query(CreditCard).delete()
            db.query(Account).delete()

        # 4. Seletivo de Categorias (desvincula transações e recria categorias padronizadas)
        if "categories" in targets:
            db.query(Transaction).update({Transaction.category_id: None})
            db.query(Category).delete()
            db.commit()
            seed_categories_if_needed(db)

        # 5. Seletivo de Histórico do Chat de IA e Tabela de Consumo
        if "chat_history" in targets:
            db.query(ChatMessage).delete()
            db.query(ChatSession).delete()
            db.query(AIUsage).delete()

        db.commit()
        return {"status": "success", "message": "Dados selecionados foram resetados com sucesso."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao resetar o banco de dados: {str(e)}")

import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
from app.core.config import settings
from app.db.database import engine

router = APIRouter(tags=["Database Import/Export"])

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

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import getDb
from app.schemas.schemas import TransactionCreate, TransactionResponse, DashboardSummary
from app.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def listTransactions(limit: int = 100, offset: int = 0, db: Session = Depends(getDb)):
    return transaction_service.getTransactions(db, limit, offset)

@router.post("", response_model=List[TransactionResponse], status_code=status.HTTP_201_CREATED)
def createTransaction(tx_in: TransactionCreate, db: Session = Depends(getDb)):
    try:
        return transaction_service.createTransaction(db, tx_in)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def deleteTransaction(tx_id: int, db: Session = Depends(getDb)):
    success = transaction_service.deleteTransaction(db, tx_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

@router.put("/{tx_id}", response_model=TransactionResponse)
def updateTransaction(tx_id: int, tx_in: TransactionCreate, db: Session = Depends(getDb)):
    updated_tx = transaction_service.updateTransaction(db, tx_id, tx_in)
    if not updated_tx:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return updated_tx

@router.get("/summary/dashboard", response_model=DashboardSummary)
def getDashboardSummary(db: Session = Depends(getDb)):
    return transaction_service.getDashboardSummary(db)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import getDb
from app.schemas.schemas import AccountCreate, AccountUpdate, AccountResponse
from app.services import account_service

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("", response_model=List[AccountResponse])
def listAccounts(db: Session = Depends(getDb)):
    return account_service.getAccounts(db)

@router.post("", response_model=AccountResponse, status_code=status.HTTP_201_CREATED)
def createAccount(account_in: AccountCreate, db: Session = Depends(getDb)):
    return account_service.createAccount(db, account_in)

@router.get("/{account_id}", response_model=AccountResponse)
def getAccount(account_id: int, db: Session = Depends(getDb)):
    account = account_service.getAccountById(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return account

@router.put("/{account_id}", response_model=AccountResponse)
def updateAccount(account_id: int, account_in: AccountUpdate, db: Session = Depends(getDb)):
    account = account_service.updateAccount(db, account_id, account_in)
    if not account:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return account

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def deleteAccount(account_id: int, db: Session = Depends(getDb)):
    success = account_service.deleteAccount(db, account_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conta não encontrada")

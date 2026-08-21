from sqlalchemy.orm import Session
from app.db.models import Account
from app.schemas.schemas import AccountCreate, AccountUpdate

def getAccounts(db: Session):
    return db.query(Account).all()

def getAccountById(db: Session, account_id: int):
    return db.query(Account).filter(Account.id == account_id).first()

def createAccount(db: Session, account_in: AccountCreate):
    account = Account(**account_in.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account

def updateAccount(db: Session, account_id: int, account_in: AccountUpdate):
    account = getAccountById(db, account_id)
    if not account:
        return None
    data = account_in.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(account, key, value)
    db.commit()
    db.refresh(account)
    return account

def deleteAccount(db: Session, account_id: int):
    account = getAccountById(db, account_id)
    if not account:
        return False
    db.delete(account)
    db.commit()
    return True

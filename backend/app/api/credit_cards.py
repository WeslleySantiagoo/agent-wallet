from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import getDb
from app.db.models import CreditCard, Invoice
from app.schemas.schemas import CreditCardCreate, CreditCardUpdate, CreditCardResponse, InvoiceResponse, PayInvoiceRequest
from app.services import credit_card_service

router = APIRouter(prefix="/credit-cards", tags=["Credit Cards"])

@router.get("", response_model=List[CreditCardResponse])
def listCreditCards(db: Session = Depends(getDb)):
    cards = db.query(CreditCard).all()
    return [
        CreditCardResponse(
            id=card.id,
            account_id=card.account_id,
            name=card.name,
            last_four_digits=card.last_four_digits,
            total_limit=card.total_limit,
            used_limit=card.used_limit,
            available_limit=card.availableLimit,
            closing_day=card.closing_day,
            due_day=card.due_day,
            created_at=card.created_at,
            updated_at=card.updated_at
        )
        for card in cards
    ]

@router.post("", response_model=CreditCardResponse, status_code=status.HTTP_201_CREATED)
def createCreditCard(card_in: CreditCardCreate, db: Session = Depends(getDb)):
    card = CreditCard(**card_in.model_dump())
    db.add(card)
    db.commit()
    db.refresh(card)
    return CreditCardResponse(
        id=card.id,
        account_id=card.account_id,
        name=card.name,
        last_four_digits=card.last_four_digits,
        total_limit=card.total_limit,
        used_limit=card.used_limit,
        available_limit=card.availableLimit,
        closing_day=card.closing_day,
        due_day=card.due_day,
        created_at=card.created_at,
        updated_at=card.updated_at
    )

@router.get("/{card_id}/invoices", response_model=List[InvoiceResponse])
def listCardInvoices(card_id: int, db: Session = Depends(getDb)):
    invoices = db.query(Invoice).filter(Invoice.credit_card_id == card_id).order_by(Invoice.year.desc(), Invoice.month.desc()).all()
    return invoices

@router.post("/{card_id}/invoices/{invoice_id}/pay", response_model=InvoiceResponse)
def payCardInvoice(card_id: int, invoice_id: int, req: PayInvoiceRequest, db: Session = Depends(getDb)):
    try:
        invoice = credit_card_service.payInvoice(db, credit_card_id=card_id, invoice_id=invoice_id, account_id=req.account_id)
        return invoice
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def deleteCreditCard(card_id: int, db: Session = Depends(getDb)):
    card = db.query(CreditCard).filter(CreditCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Cartão não encontrado")
    db.delete(card)
    db.commit()

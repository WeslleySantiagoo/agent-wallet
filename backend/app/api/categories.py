from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import getDb
from app.db.models import Category
from app.schemas.schemas import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def listCategories(db: Session = Depends(getDb)):
    return db.query(Category).all()

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def createCategory(cat_in: CategoryCreate, db: Session = Depends(getDb)):
    cat = Category(**cat_in.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def deleteCategory(category_id: int, db: Session = Depends(getDb)):
    cat = db.query(Category).filter(Category.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    db.delete(cat)
    db.commit()

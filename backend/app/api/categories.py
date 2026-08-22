from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import getDb
from app.db.models import Category
from app.schemas.schemas import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])

DEFAULT_CATEGORIES = [
    {"name": "Alimentação", "icon": "Utensils", "color": "#FF7A00"},
    {"name": "Moradia", "icon": "Home", "color": "#4CAF50"},
    {"name": "Transporte", "icon": "Car", "color": "#2196F3"},
    {"name": "Lazer", "icon": "Tv", "color": "#9C27B0"},
    {"name": "Saúde", "icon": "HeartPulse", "color": "#E57373"},
    {"name": "Educação", "icon": "GraduationCap", "color": "#FFB74D"},
    {"name": "Vestuário", "icon": "ShoppingBag", "color": "#EC407A"},
    {"name": "Investimentos", "icon": "TrendingUp", "color": "#00E676"},
    {"name": "Salário / Receita", "icon": "DollarSign", "color": "#4CAF50"},
    {"name": "Outros", "icon": "Tag", "color": "#9C9589"},
]

@router.get("", response_model=List[CategoryResponse])
def listCategories(db: Session = Depends(getDb)):
    cats = db.query(Category).all()
    if not cats:
        for c in DEFAULT_CATEGORIES:
            db.add(Category(**c))
        db.commit()
        cats = db.query(Category).all()
    return cats

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

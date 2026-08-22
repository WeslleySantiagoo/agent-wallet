from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import getDb
from app.db.models import Category
from app.schemas.schemas import CategoryCreate, CategoryResponse

router = APIRouter(prefix="/categories", tags=["Categories"])

CATEGORIES_STRUCTURE = [
    {
        "name": "Suas Categorias",
        "icon": "Sparkles",
        "color": "#FFD700",
        "subs": []
    },
    {
        "name": "Alimentação",
        "icon": "Utensils",
        "color": "#FF7A00",
        "subs": [
            "Supermercado",
            "Alimentos e bebidas",
            "Restaurantes, bares e lanchonetes",
            "Delivery de alimentos"
        ]
    },
    {
        "name": "Compras",
        "icon": "ShoppingBag",
        "color": "#EC407A",
        "subs": [
            "Compras",
            "Compras online",
            "Eletrônicos",
            "Pet Shops e veterinários",
            "Vestuário",
            "Artigos infantis",
            "Livraria",
            "Artigos esportivos",
            "Papelaria",
            "Cashback"
        ]
    },
    {
        "name": "Saúde e bem-estar",
        "icon": "HeartPulse",
        "color": "#E57373",
        "subs": [
            "Saúde",
            "Saúde e bem-estar",
            "Bem-estar",
            "Academia e centros de lazer",
            "Prática de esportes",
            "Dentista",
            "Ótica",
            "Hospitais, clínicas e laboratórios",
            "Farmácia"
        ]
    },
    {
        "name": "Serviços digitais",
        "icon": "Tv",
        "color": "#9C27B0",
        "subs": [
            "Serviços digitais",
            "Jogos e videogames",
            "Streaming de vídeo",
            "Streaming de música"
        ]
    },
    {
        "name": "Transporte",
        "icon": "Car",
        "color": "#2196F3",
        "subs": [
            "Transporte",
            "Táxi e transporte privado urbano",
            "Transporte público",
            "Aluguel de veículos",
            "Aluguel de bicicletas",
            "Serviços automotivos",
            "Postos de gasolina",
            "Estacionamentos",
            "Pedágios e pagamentos no veículo",
            "Taxas e Impostos sobre veículos",
            "Manutenção de veículos",
            "Multas de trânsito"
        ]
    },
    {
        "name": "Moradia",
        "icon": "Home",
        "color": "#4CAF50",
        "subs": [
            "Moradia",
            "Aluguel",
            "Serviços de utilidade pública",
            "Água",
            "Eletricidade",
            "Gás",
            "Utensílios para casa",
            "Impostos sobre moradia",
            "Telecomunicação",
            "Internet",
            "Celular",
            "TV"
        ]
    },
    {
        "name": "Lazer e entretenimento",
        "icon": "Ticket",
        "color": "#FF9800",
        "subs": [
            "Lazer",
            "Viagens",
            "Aeroportos e cias. aéreas",
            "Hospedagem",
            "Programas de milhagem",
            "Passagem de ônibus",
            "Bilhetes",
            "Estádios e arenas",
            "Museus e pontos turísticos",
            "Cinema, Teatro e Concertos"
        ]
    },
    {
        "name": "Finanças",
        "icon": "Landmark",
        "color": "#26A69A",
        "subs": [
            "Investimentos",
            "Investimento automático",
            "Renda fixa",
            "Fundos multimercado",
            "Renda variável",
            "Ajuste de margem",
            "Juros de rendimentos de dividendos",
            "Pensão",
            "Transferência mesma titularidade",
            "Transferência mesma titularidade - Dinheiro",
            "Transferência mesma titularidade - PIX",
            "Transferência mesma titularidade - TED",
            "Transferências",
            "Transferência - Boleto bancário",
            "Transferência - Dinheiro",
            "Transferência - Cheque",
            "Transferências- DOC",
            "Transferência - Câmbio",
            "Transferência - Mesma instituição",
            "Transferência - PIX",
            "Transferência - TED",
            "Transferências para terceiros",
            "Transferência para terceiros - Boleto bancário",
            "Transferência para terceiros - Débito",
            "Transferência para terceiros - DOC",
            "Transferência para terceiros - PIX",
            "Transferência para terceiros - TED",
            "Pagamento de cartão de crédito",
            "Parcelamento de fatura",
            "Empréstimos e financiamento",
            "Atraso no pagamento e custos de cheque especial",
            "Juros cobrados",
            "Financiamento",
            "Financiamento imobiliário",
            "Financiamento de veículos",
            "Empréstimo estudantil",
            "Empréstimos",
            "Obrigações legais",
            "Saldo bloqueado",
            "Pensão alimentícia"
        ]
    },
    {
        "name": "Renda",
        "icon": "DollarSign",
        "color": "#4CAF50",
        "subs": [
            "Renda",
            "Salário",
            "Aposentadoria",
            "Atividades de empreendedorismo",
            "Auxílio do governo",
            "Renda não-recorrente"
        ]
    },
    {
        "name": "Educação",
        "icon": "GraduationCap",
        "color": "#FFB74D",
        "subs": [
            "Educação",
            "Cursos online",
            "Universidade",
            "Escola",
            "Creche"
        ]
    },
    {
        "name": "Seguros",
        "icon": "ShieldCheck",
        "color": "#00BCD4",
        "subs": [
            "Seguros",
            "Seguro de vida",
            "Seguro residencial",
            "Saúde",
            "Seguro de veículos"
        ]
    },
    {
        "name": "Apostas e jogos",
        "icon": "Dices",
        "color": "#AB47BC",
        "subs": [
            "Apostas",
            "Loteria",
            "Apostas online"
        ]
    },
    {
        "name": "Doações",
        "icon": "Heart",
        "color": "#E91E63",
        "subs": [
            "Doações"
        ]
    },
    {
        "name": "Outros",
        "icon": "Tag",
        "color": "#9C9589",
        "subs": [
            "Outros",
            "Serviços de utilidade pública"
        ]
    }
]

def seed_categories_if_needed(db: Session):
    for macro in CATEGORIES_STRUCTURE:
        parent_cat = db.query(Category).filter(Category.name == macro["name"], Category.parent_id == None).first()
        if not parent_cat:
            parent_cat = Category(name=macro["name"], icon=macro["icon"], color=macro["color"], parent_id=None)
            db.add(parent_cat)
            db.flush()
        else:
            parent_cat.icon = macro["icon"]
            parent_cat.color = macro["color"]
            db.flush()
        
        for sub_name in macro["subs"]:
            existing_sub = db.query(Category).filter(Category.name == sub_name).first()
            if not existing_sub:
                sub_cat = Category(name=sub_name, icon=macro["icon"], color=macro["color"], parent_id=parent_cat.id)
                db.add(sub_cat)
            else:
                if existing_sub.id != parent_cat.id and existing_sub.parent_id is None:
                    existing_sub.parent_id = parent_cat.id
                    existing_sub.icon = macro["icon"]
                    existing_sub.color = macro["color"]
    db.commit()

@router.get("", response_model=List[CategoryResponse])
def listCategories(db: Session = Depends(getDb)):
    seed_categories_if_needed(db)
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

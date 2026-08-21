from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime, date as PyDate
from app.db.models import AccountType, InvoiceStatus, TransactionType

# --- Account Schemas ---
class AccountBase(BaseModel):
    name: str
    type: AccountType = AccountType.CHECKING
    balance: float = 0.0
    institution: Optional[str] = None

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[AccountType] = None
    balance: Optional[float] = None
    institution: Optional[str] = None

class AccountResponse(AccountBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Credit Card Schemas ---
class CreditCardBase(BaseModel):
    account_id: int
    name: str
    last_four_digits: Optional[str] = None
    total_limit: float = Field(gt=0, description="Total credit limit")
    closing_day: int = Field(ge=1, le=31)
    due_day: int = Field(ge=1, le=31)

class CreditCardCreate(CreditCardBase):
    pass

class CreditCardUpdate(BaseModel):
    name: Optional[str] = None
    last_four_digits: Optional[str] = None
    total_limit: Optional[float] = None
    closing_day: Optional[int] = None
    due_day: Optional[int] = None

class CreditCardResponse(CreditCardBase):
    id: int
    used_limit: float
    available_limit: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Invoice Schemas ---
class InvoiceResponse(BaseModel):
    id: int
    credit_card_id: int
    month: int
    year: int
    status: InvoiceStatus
    total_amount: float
    paid_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PayInvoiceRequest(BaseModel):
    account_id: int

# --- Category Schemas ---
class CategoryBase(BaseModel):
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    description: str
    amount: float
    type: TransactionType
    date: PyDate = Field(default_factory=PyDate.today)
    account_id: Optional[int] = None
    credit_card_id: Optional[int] = None
    category_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    is_installment: bool = False
    total_installments: Optional[int] = Field(default=1, ge=1)

class TransactionResponse(TransactionBase):
    id: int
    invoice_id: Optional[int] = None
    is_installment: bool
    installment_number: Optional[int] = None
    total_installments: Optional[int] = None
    installment_group_id: Optional[str] = None
    account_name: Optional[str] = None
    institution: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard Summary Schema ---
class DashboardSummary(BaseModel):
    total_balance: float
    total_monthly_expenses: float
    total_monthly_income: float
    net_cash_flow: float
    active_accounts_count: int
    active_cards_count: int
    total_credit_limit: float = 0.0
    used_credit_limit: float = 0.0
    primary_card: Optional[dict] = None
    active_installments_count: int
    recent_transactions: List[TransactionResponse]
    categories_breakdown: List[dict]
    monthly_evolution: List[dict] = []

# --- Chat Session & Message Schemas ---
class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    sender: str
    text: str
    actions_executed: Optional[List[dict]] = None
    charts: Optional[List[dict]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    last_provider: Optional[str] = None
    last_model: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True

# --- AI Usage Schemas ---
class AIUsageModelDetails(BaseModel):
    provider: str
    model: str
    requests: int
    input_tokens: int
    output_tokens: int
    total_tokens: int
    rpm: float
    tpm: float
    rpd: float

class AIUsageSummary(BaseModel):
    total_requests: int
    total_requests_today: int
    total_tokens: int
    global_rpm: float
    global_tpm: float
    global_rpd: float
    models: List[AIUsageModelDetails] = []

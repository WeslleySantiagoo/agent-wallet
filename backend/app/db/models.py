from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, Text, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base

class AccountType(str, enum.Enum):
    CHECKING = "CHECKING"
    SAVINGS = "SAVINGS"
    INVESTMENT = "INVESTMENT"

class InvoiceStatus(str, enum.Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    PAID = "PAID"

class TransactionType(str, enum.Enum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"
    TRANSFER = "TRANSFER"
    CARD_PURCHASE = "CARD_PURCHASE"

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    type = Column(SQLEnum(AccountType), default=AccountType.CHECKING, nullable=False)
    balance = Column(Float, default=0.0, nullable=False)
    institution = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships with CASCADE
    credit_cards = relationship("CreditCard", back_populates="account", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")

class CreditCard(Base):
    __tablename__ = "credit_cards"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    last_four_digits = Column(String(4), nullable=True)
    total_limit = Column(Float, nullable=False, default=0.0)
    used_limit = Column(Float, nullable=False, default=0.0)
    closing_day = Column(Integer, nullable=False)  # 1-31
    due_day = Column(Integer, nullable=False)      # 1-31
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    account = relationship("Account", back_populates="credit_cards")
    invoices = relationship("Invoice", back_populates="credit_card", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="credit_card", cascade="all, delete-orphan")

    @property
    def availableLimit(self) -> float:
        return max(0.0, self.total_limit - self.used_limit)

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    credit_card_id = Column(Integer, ForeignKey("credit_cards.id", ondelete="CASCADE"), nullable=False)
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    status = Column(SQLEnum(InvoiceStatus), default=InvoiceStatus.OPEN, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    credit_card = relationship("CreditCard", back_populates="invoices")
    transactions = relationship("Transaction", back_populates="invoice")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    icon = Column(String(50), nullable=True)
    color = Column(String(20), nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True)

    parent = relationship("Category", remote_side=[id], backref="subcategories")
    transactions = relationship("Transaction", back_populates="category")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=True)
    credit_card_id = Column(Integer, ForeignKey("credit_cards.id", ondelete="CASCADE"), nullable=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="SET NULL"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    
    amount = Column(Float, nullable=False)
    description = Column(String(255), nullable=False)
    type = Column(SQLEnum(TransactionType), nullable=False)
    date = Column(Date, default=date.today, nullable=False)
    
    is_installment = Column(Boolean, default=False, nullable=False)
    installment_number = Column(Integer, nullable=True)
    total_installments = Column(Integer, nullable=True)
    installment_group_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    account = relationship("Account", back_populates="transactions")
    credit_card = relationship("CreditCard", back_populates="transactions")
    invoice = relationship("Invoice", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")

    @property
    def institution(self) -> str | None:
        if self.account:
            return self.account.institution or self.account.name
        if self.credit_card and self.credit_card.account:
            return self.credit_card.account.institution or self.credit_card.account.name
        return None

    @property
    def account_name(self) -> str | None:
        if self.account:
            return self.account.name
        if self.credit_card:
            return self.credit_card.name
        return None

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), default="Nova Conversa", nullable=False)
    last_provider = Column(String(50), nullable=True)
    last_model = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.id")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    sender = Column(String(10), nullable=False)  # "user" or "bot"
    text = Column(Text, nullable=False)
    actions_executed = Column(Text, nullable=True)  # JSON string
    charts = Column(Text, nullable=True)            # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("ChatSession", back_populates="messages")

class AIUsage(Base):
    __tablename__ = "ai_usage"

    id = Column(Integer, primary_key=True, index=True)
    provider = Column(String(50), nullable=False)
    model = Column(String(100), nullable=False)
    input_tokens = Column(Integer, default=0)
    output_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    endpoint = Column(String(100), nullable=True) # ex: chat, transcribe
    created_at = Column(DateTime, default=datetime.utcnow)

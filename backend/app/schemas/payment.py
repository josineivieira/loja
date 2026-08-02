import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class PaymentSessionRequest(BaseModel):
    order_number: str


class PaymentSessionResponse(BaseModel):
    order_number: str
    gateway: str
    status: str
    amount: Decimal
    currency: str
    checkout_session_id: str | None = None
    payment_url: str | None = None
    mode: str


class PaymentRead(BaseModel):
    id: uuid.UUID
    gateway: str
    transaction_id: str | None
    checkout_session_id: str | None
    amount: Decimal
    currency: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


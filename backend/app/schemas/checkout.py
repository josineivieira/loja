import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field


class CheckoutItem(BaseModel):
    product_id: uuid.UUID
    variant_id: uuid.UUID
    quantity: int = Field(ge=1, le=99)


class CheckoutAddress(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    country: str = Field(min_length=2, max_length=2)
    state: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=120)
    address_line1: str = Field(min_length=3, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    district: str | None = Field(default=None, max_length=120)
    postal_code: str = Field(min_length=3, max_length=30)
    notes: str | None = Field(default=None, max_length=1000)


class CheckoutCalculateRequest(BaseModel):
    items: list[CheckoutItem] = Field(min_length=1)
    address: CheckoutAddress | None = None
    shipping_method_code: str | None = None
    coupon_code: str | None = None
    currency: str = Field(default="USD", min_length=3, max_length=3)


class CheckoutCreateOrderRequest(CheckoutCalculateRequest):
    address: CheckoutAddress
    idempotency_key: str = Field(min_length=8, max_length=120)


class CheckoutLine(BaseModel):
    product_id: uuid.UUID
    variant_id: uuid.UUID
    product_name: str
    variant_sku: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    currency: str


class ShippingQuote(BaseModel):
    code: str
    name: str
    amount: Decimal
    currency: str
    min_days: int
    max_days: int
    tracking_available: bool


class CheckoutTotals(BaseModel):
    subtotal_amount: Decimal
    discount_amount: Decimal
    shipping_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    currency: str
    coupon_code: str | None = None
    shipping_method_code: str | None = None


class CheckoutCalculationResponse(BaseModel):
    items: list[CheckoutLine]
    shipping_methods: list[ShippingQuote]
    totals: CheckoutTotals


class OrderItemRead(CheckoutLine):
    id: uuid.UUID

    class Config:
        from_attributes = True


class OrderRead(BaseModel):
    id: uuid.UUID
    order_number: str
    customer_email: EmailStr
    status: str
    payment_status: str
    fulfillment_status: str
    supplier_status: str
    subtotal_amount: Decimal
    discount_amount: Decimal
    shipping_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    currency: str
    created_at: datetime
    items: list[OrderItemRead] = []

    class Config:
        from_attributes = True


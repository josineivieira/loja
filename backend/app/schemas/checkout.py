import uuid
from datetime import datetime
from decimal import Decimal
import re

from pydantic import BaseModel, EmailStr, Field, field_validator


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

    @field_validator("first_name", "last_name", "state", "city")
    @classmethod
    def validate_real_text(cls, value: str) -> str:
        cleaned = value.strip()
        compact = re.sub(r"\s+", "", cleaned)
        if not re.search(r"[aeiouAEIOU]", cleaned) or re.fullmatch(r"(.)\1{2,}", compact, flags=re.IGNORECASE):
            raise ValueError("Invalid text field")
        return cleaned

    @field_validator("address_line1")
    @classmethod
    def validate_address_line1(cls, value: str) -> str:
        cleaned = value.strip()
        compact = re.sub(r"\s+", "", cleaned)
        if len(cleaned) < 8 or not re.search(r"\d", cleaned) or not re.search(r"[a-zA-Z]{3,}", cleaned):
            raise ValueError("Address must include street name and number")
        if re.fullmatch(r"(.)\1{4,}", compact, flags=re.IGNORECASE):
            raise ValueError("Invalid address")
        return cleaned

    @field_validator("postal_code")
    @classmethod
    def validate_postal_code(cls, value: str) -> str:
        cleaned = value.strip()
        if len(re.sub(r"\D", "", cleaned)) < 5:
            raise ValueError("Invalid postal code")
        return cleaned


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
    supplier_sku: str | None = None
    supplier_variant_id: str | None = None
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

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field


class AdminDashboardRead(BaseModel):
    sales_today: Decimal
    sales_month: Decimal
    total_orders: int
    pending_orders: int
    paid_orders: int
    shipped_orders: int
    delivered_orders: int
    cancelled_orders: int
    average_order_value: Decimal
    new_customers: int
    low_stock: int
    failed_payments: int
    supplier_pending: int


class AdminCustomerRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    first_name: str
    last_name: str
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    roles: list[str]


class AdminOrderStatusUpdate(BaseModel):
    status: str = Field(max_length=40)
    note: str | None = Field(default=None, max_length=1000)
    tracking_number: str | None = Field(default=None, max_length=120)
    carrier: str | None = Field(default=None, max_length=120)


class CouponCreate(BaseModel):
    code: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=140)
    discount_type: str = Field(pattern="^(percent|fixed|free_shipping)$")
    value: Decimal = Field(ge=0)
    minimum_amount: Decimal = Field(default=0, ge=0)
    active: bool = True


class CouponUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=140)
    discount_type: str | None = Field(default=None, pattern="^(percent|fixed|free_shipping)$")
    value: Decimal | None = Field(default=None, ge=0)
    minimum_amount: Decimal | None = Field(default=None, ge=0)
    active: bool | None = None


class CouponRead(CouponCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ShippingMethodCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    code: str = Field(min_length=2, max_length=80)
    origin_country: str = Field(default="CN", min_length=2, max_length=2)
    countries: list[str] = []
    min_days: int = Field(default=7, ge=1)
    max_days: int = Field(default=18, ge=1)
    amount: Decimal = Field(default=0, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    tracking_available: bool = True
    active: bool = True
    free_over_amount: Decimal | None = Field(default=None, ge=0)


class ShippingMethodUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    origin_country: str | None = Field(default=None, min_length=2, max_length=2)
    countries: list[str] | None = None
    min_days: int | None = Field(default=None, ge=1)
    max_days: int | None = Field(default=None, ge=1)
    amount: Decimal | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    tracking_available: bool | None = None
    active: bool | None = None
    free_over_amount: Decimal | None = Field(default=None, ge=0)


class ShippingMethodRead(ShippingMethodCreate):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


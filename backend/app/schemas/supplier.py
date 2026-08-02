from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, Field


class SupplierOrderItemRead(BaseModel):
    product_name: str
    variant_sku: str
    supplier_sku: str | None
    supplier_variant_id: str | None
    quantity: int
    unit_price: Decimal


class SupplierOrderPayloadRead(BaseModel):
    order_number: str
    customer_email: str
    shipping_address: dict[str, Any] | None
    items: list[SupplierOrderItemRead]
    supplier_status: str
    supplier_order_id: str | None
    supplier_real_cost: Decimal | None
    copyable_payload: dict[str, Any]


class SupplierSubmissionUpdate(BaseModel):
    supplier_order_id: str = Field(min_length=2, max_length=120)
    supplier_real_cost: Decimal | None = Field(default=None, ge=0)
    note: str | None = Field(default=None, max_length=1000)


class SupplierTrackingUpdate(BaseModel):
    tracking_number: str = Field(min_length=2, max_length=120)
    carrier: str = Field(min_length=2, max_length=120)
    status: str = Field(default="shipped", max_length=40)
    location: str | None = Field(default=None, max_length=180)
    description: str = Field(default="Tracking number added manually.", max_length=1000)


class SupplierActionRead(BaseModel):
    order_number: str
    supplier_status: str
    supplier_order_id: str | None
    updated_at: datetime


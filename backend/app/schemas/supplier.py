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


class SupplierProductVariantRead(BaseModel):
    supplier_variant_id: str
    sku: str
    name: str | None = None
    options: dict[str, str] = Field(default_factory=dict)
    price: Decimal
    cost: Decimal
    stock: int
    image_url: str | None = None


class SupplierProductRead(BaseModel):
    supplier_product_id: str
    name: str
    sku: str
    description: str | None = None
    image_url: str | None = None
    images: list[str] = Field(default_factory=list)
    variants: list[SupplierProductVariantRead]
    raw: dict[str, Any] = Field(default_factory=dict)


class SupplierProductImportVariant(BaseModel):
    supplier_variant_id: str = Field(min_length=2, max_length=120)
    sku: str = Field(min_length=2, max_length=120)
    name: str | None = Field(default=None, max_length=500)
    options: dict[str, str] = Field(default_factory=dict)
    sale_price: Decimal = Field(ge=0)
    cost_price: Decimal = Field(default=0, ge=0)
    stock: int = Field(default=0, ge=0)
    image_url: str | None = None
    selected: bool = True


class SupplierProductImportRequest(BaseModel):
    supplier_product_id: str = Field(min_length=2, max_length=120)
    name: str = Field(min_length=2, max_length=180)
    sku: str = Field(min_length=2, max_length=100)
    sale_price: Decimal = Field(ge=0)
    cost_price: Decimal = Field(default=0, ge=0)
    stock: int = Field(default=0, ge=0)
    supplier_variant_id: str = Field(min_length=2, max_length=120)
    supplier_sku: str | None = Field(default=None, max_length=120)
    description: str | None = None
    image_url: str | None = None
    images: list[str] = Field(default_factory=list)
    variants: list[SupplierProductImportVariant] = Field(default_factory=list)
    category_id: str | None = None


class SupplierVariantShippingEstimateRequest(BaseModel):
    supplier_variant_id: str = Field(min_length=2, max_length=120)
    supplier_product_id: str | None = Field(default=None, max_length=120)
    quantity: int = Field(default=1, ge=1, le=99)
    country: str = Field(min_length=2, max_length=2)
    state: str = Field(min_length=1, max_length=100)
    city: str = Field(min_length=1, max_length=120)
    postal_code: str = Field(min_length=3, max_length=30)


class SupplierVariantShippingEstimateRead(BaseModel):
    code: str
    name: str
    amount: Decimal
    currency: str
    min_days: int
    max_days: int
    tracking_available: bool

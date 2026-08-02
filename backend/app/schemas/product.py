import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ProductImageRead(BaseModel):
    id: uuid.UUID
    url: str
    alt_text: str | None
    sort_order: int
    is_primary: bool

    class Config:
        from_attributes = True


class ProductVariantCreate(BaseModel):
    sku: str = Field(min_length=2, max_length=120)
    supplier_variant_id: str | None = None
    price: Decimal = Field(ge=0)
    cost: Decimal = Field(default=0, ge=0)
    stock: int = Field(default=0, ge=0)
    image_url: str | None = None
    weight: Decimal | None = Field(default=None, ge=0)
    status: str = "active"


class ProductVariantRead(ProductVariantCreate):
    id: uuid.UUID

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    slug: str = Field(min_length=2, max_length=220)
    short_description: str | None = None
    description: str | None = None
    sku: str = Field(min_length=2, max_length=100)
    supplier_sku: str | None = None
    supplier_product_id: str | None = None
    category_id: uuid.UUID | None = None
    supplier_id: uuid.UUID | None = None
    cost_price: Decimal = Field(default=0, ge=0)
    sale_price: Decimal = Field(ge=0)
    compare_at_price: Decimal | None = Field(default=None, ge=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    weight: Decimal | None = Field(default=None, ge=0)
    width: Decimal | None = Field(default=None, ge=0)
    height: Decimal | None = Field(default=None, ge=0)
    length: Decimal | None = Field(default=None, ge=0)
    status: str = "draft"
    featured: bool = False
    is_new: bool = False
    is_bestseller: bool = False
    seo_title: str | None = None
    seo_description: str | None = None
    variants: list[ProductVariantCreate] = []


class ProductUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    short_description: str | None = None
    description: str | None = None
    category_id: uuid.UUID | None = None
    cost_price: Decimal | None = Field(default=None, ge=0)
    sale_price: Decimal | None = Field(default=None, ge=0)
    compare_at_price: Decimal | None = Field(default=None, ge=0)
    status: str | None = None
    featured: bool | None = None
    is_new: bool | None = None
    is_bestseller: bool | None = None
    seo_title: str | None = None
    seo_description: str | None = None


class ProductRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    short_description: str | None
    description: str | None
    sku: str
    supplier_sku: str | None
    supplier_product_id: str | None
    cost_price: Decimal
    sale_price: Decimal
    compare_at_price: Decimal | None
    currency: str
    status: str
    featured: bool
    is_new: bool
    is_bestseller: bool
    created_at: datetime
    updated_at: datetime
    variants: list[ProductVariantRead] = []
    images: list[ProductImageRead] = []

    class Config:
        from_attributes = True


import uuid
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Product(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "products"

    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    supplier_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(180), index=True)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    short_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    sku: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    supplier_sku: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    supplier_product_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    sale_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), index=True)
    compare_at_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    weight: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    width: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    height: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    length: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="draft", index=True)
    featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_new: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_bestseller: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    seo_title: Mapped[str | None] = mapped_column(String(180), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(String(300), nullable=True)

    category: Mapped["Category | None"] = relationship(back_populates="products")
    supplier: Mapped["Supplier | None"] = relationship(back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    videos: Mapped[list["ProductVideo"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    options: Mapped[list["ProductOption"]] = relationship(back_populates="product", cascade="all, delete-orphan")
    variants: Mapped[list["ProductVariant"]] = relationship(back_populates="product", cascade="all, delete-orphan")


class ProductImage(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "product_images"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), index=True)
    url: Mapped[str] = mapped_column(String(700))
    alt_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

    product: Mapped[Product] = relationship(back_populates="images")


class ProductVideo(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "product_videos"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), index=True)
    url: Mapped[str] = mapped_column(String(700))
    provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped[Product] = relationship(back_populates="videos")


class ProductOption(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "product_options"
    __table_args__ = (UniqueConstraint("product_id", "name", name="uq_product_option_name"),)

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    display_name: Mapped[str] = mapped_column(String(120))
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    product: Mapped[Product] = relationship(back_populates="options")
    values: Mapped[list["ProductOptionValue"]] = relationship(back_populates="option", cascade="all, delete-orphan")


class ProductOptionValue(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "product_option_values"
    __table_args__ = (UniqueConstraint("option_id", "value", name="uq_product_option_value"),)

    option_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("product_options.id"), index=True)
    value: Mapped[str] = mapped_column(String(120))
    label: Mapped[str] = mapped_column(String(140))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    option: Mapped[ProductOption] = relationship(back_populates="values")
    variant_links: Mapped[list["VariantOptionValue"]] = relationship(back_populates="option_value")


class ProductVariant(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "product_variants"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), index=True)
    sku: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    supplier_variant_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    image_url: Mapped[str | None] = mapped_column(String(700), nullable=True)
    weight: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active", index=True)

    product: Mapped[Product] = relationship(back_populates="variants")
    option_values: Mapped[list["VariantOptionValue"]] = relationship(back_populates="variant", cascade="all, delete-orphan")
    inventory: Mapped["Inventory | None"] = relationship(back_populates="variant", cascade="all, delete-orphan", uselist=False)


class VariantOptionValue(TimestampMixin, Base):
    __tablename__ = "variant_option_values"
    __table_args__ = (UniqueConstraint("variant_id", "option_value_id", name="uq_variant_option_value"),)

    variant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("product_variants.id"), primary_key=True)
    option_value_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_option_values.id"), primary_key=True
    )

    variant: Mapped[ProductVariant] = relationship(back_populates="option_values")
    option_value: Mapped[ProductOptionValue] = relationship(back_populates="variant_links")


class Inventory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "inventories"

    variant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("product_variants.id"), unique=True)
    quantity_on_hand: Mapped[int] = mapped_column(Integer, default=0)
    quantity_reserved: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5)

    variant: Mapped[ProductVariant] = relationship(back_populates="inventory")

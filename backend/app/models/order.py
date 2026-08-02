import uuid
from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class ShippingMethod(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "shipping_methods"

    name: Mapped[str] = mapped_column(String(120), index=True)
    code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    origin_country: Mapped[str] = mapped_column(String(2), default="CN")
    countries: Mapped[list[str]] = mapped_column(JSONB, default=list)
    min_days: Mapped[int] = mapped_column(Integer, default=7)
    max_days: Mapped[int] = mapped_column(Integer, default=18)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    tracking_available: Mapped[bool] = mapped_column(Boolean, default=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    free_over_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)


class Coupon(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "coupons"

    code: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(140))
    discount_type: Mapped[str] = mapped_column(String(30))
    value: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    minimum_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class Order(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    customer_email: Mapped[str] = mapped_column(String(255), index=True)
    customer_first_name: Mapped[str] = mapped_column(String(80))
    customer_last_name: Mapped[str] = mapped_column(String(80))
    customer_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="awaiting_payment", index=True)
    payment_status: Mapped[str] = mapped_column(String(40), default="pending", index=True)
    fulfillment_status: Mapped[str] = mapped_column(String(40), default="pending", index=True)
    supplier_status: Mapped[str] = mapped_column(String(40), default="supplier_pending", index=True)
    supplier_order_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    supplier_provider: Mapped[str] = mapped_column(String(60), default="manual", index=True)
    supplier_real_cost: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    supplier_payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    subtotal_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    shipping_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    original_currency: Mapped[str] = mapped_column(String(3), default="USD")
    charged_currency: Mapped[str] = mapped_column(String(3), default="USD")
    exchange_rate: Mapped[Decimal] = mapped_column(Numeric(12, 6), default=1)
    coupon_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    shipping_method_code: Mapped[str | None] = mapped_column(String(80), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    items: Mapped[list["OrderItem"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    addresses: Mapped[list["OrderAddress"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    history: Mapped[list["OrderStatusHistory"]] = relationship(back_populates="order", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="order", cascade="all, delete-orphan")


class OrderItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), index=True)
    variant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("product_variants.id"), index=True)
    product_name: Mapped[str] = mapped_column(String(180))
    variant_sku: Mapped[str] = mapped_column(String(120), index=True)
    supplier_sku: Mapped[str | None] = mapped_column(String(120), nullable=True)
    supplier_variant_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="USD")

    order: Mapped[Order] = relationship(back_populates="items")


class OrderAddress(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "order_addresses"

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), index=True)
    address_type: Mapped[str] = mapped_column(String(30), default="shipping")
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    country: Mapped[str] = mapped_column(String(2), index=True)
    state: Mapped[str] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(120))
    address_line1: Mapped[str] = mapped_column(String(255))
    address_line2: Mapped[str | None] = mapped_column(String(255), nullable=True)
    district: Mapped[str | None] = mapped_column(String(120), nullable=True)
    postal_code: Mapped[str] = mapped_column(String(30), index=True)

    order: Mapped[Order] = relationship(back_populates="addresses")


class OrderStatusHistory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "order_status_history"

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), index=True)
    from_status: Mapped[str | None] = mapped_column(String(40), nullable=True)
    to_status: Mapped[str] = mapped_column(String(40), index=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped[Order] = relationship(back_populates="history")


class Payment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payments"

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), index=True)
    gateway: Mapped[str] = mapped_column(String(40), default="stripe", index=True)
    transaction_id: Mapped[str | None] = mapped_column(String(180), nullable=True, index=True)
    checkout_session_id: Mapped[str | None] = mapped_column(String(180), nullable=True, index=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    status: Mapped[str] = mapped_column(String(40), default="pending", index=True)
    payment_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    order: Mapped[Order] = relationship(back_populates="payments")
    events: Mapped[list["PaymentEvent"]] = relationship(back_populates="payment", cascade="all, delete-orphan")


class PaymentEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "payment_events"

    payment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=True, index=True)
    gateway: Mapped[str] = mapped_column(String(40), default="stripe", index=True)
    event_id: Mapped[str | None] = mapped_column(String(180), nullable=True, unique=True, index=True)
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    payload: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    processed: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    payment: Mapped[Payment | None] = relationship(back_populates="events")


class Shipment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "shipments"

    order_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("orders.id"), index=True)
    tracking_number: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    carrier: Mapped[str | None] = mapped_column(String(120), nullable=True)
    supplier_order_id: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(40), default="pending", index=True)

    events: Mapped[list["TrackingEvent"]] = relationship(back_populates="shipment", cascade="all, delete-orphan")


class TrackingEvent(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "tracking_events"

    shipment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shipments.id"), index=True)
    status: Mapped[str] = mapped_column(String(60), index=True)
    location: Mapped[str | None] = mapped_column(String(180), nullable=True)
    description: Mapped[str] = mapped_column(Text)

    shipment: Mapped[Shipment] = relationship(back_populates="events")

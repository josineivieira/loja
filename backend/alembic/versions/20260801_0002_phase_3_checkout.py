"""phase 3 checkout orders coupons shipping

Revision ID: 20260801_0002
Revises: 20260801_0001
Create Date: 2026-08-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260801_0002"
down_revision: str | None = "20260801_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def ts() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def pk() -> sa.Column:
    return sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True)


def upgrade() -> None:
    op.create_table(
        "shipping_methods",
        pk(),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("code", sa.String(80), nullable=False),
        sa.Column("origin_country", sa.String(2), nullable=False, server_default="CN"),
        sa.Column("countries", postgresql.JSONB(), nullable=False, server_default="[]"),
        sa.Column("min_days", sa.Integer(), nullable=False, server_default="7"),
        sa.Column("max_days", sa.Integer(), nullable=False, server_default="18"),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("tracking_available", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("free_over_amount", sa.Numeric(12, 2), nullable=True),
        *ts(),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_shipping_methods_code", "shipping_methods", ["code"], unique=True)
    op.create_index("ix_shipping_methods_name", "shipping_methods", ["name"])
    op.create_index("ix_shipping_methods_active", "shipping_methods", ["active"])

    op.create_table(
        "coupons",
        pk(),
        sa.Column("code", sa.String(80), nullable=False),
        sa.Column("name", sa.String(140), nullable=False),
        sa.Column("discount_type", sa.String(30), nullable=False),
        sa.Column("value", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("minimum_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        *ts(),
        sa.UniqueConstraint("code"),
    )
    op.create_index("ix_coupons_code", "coupons", ["code"], unique=True)
    op.create_index("ix_coupons_active", "coupons", ["active"])

    op.create_table(
        "orders",
        pk(),
        sa.Column("order_number", sa.String(40), nullable=False),
        sa.Column("customer_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("customer_email", sa.String(255), nullable=False),
        sa.Column("customer_first_name", sa.String(80), nullable=False),
        sa.Column("customer_last_name", sa.String(80), nullable=False),
        sa.Column("customer_phone", sa.String(40), nullable=True),
        sa.Column("status", sa.String(40), nullable=False, server_default="awaiting_payment"),
        sa.Column("payment_status", sa.String(40), nullable=False, server_default="pending"),
        sa.Column("fulfillment_status", sa.String(40), nullable=False, server_default="pending"),
        sa.Column("supplier_status", sa.String(40), nullable=False, server_default="supplier_pending"),
        sa.Column("subtotal_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("shipping_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("tax_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("original_currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("charged_currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("exchange_rate", sa.Numeric(12, 6), nullable=False, server_default="1"),
        sa.Column("coupon_code", sa.String(80), nullable=True),
        sa.Column("shipping_method_code", sa.String(80), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        *ts(),
        sa.UniqueConstraint("order_number"),
    )
    for col in ["order_number", "customer_email", "status", "payment_status", "created_at"]:
        op.create_index(f"ix_orders_{col}", "orders", [col], unique=col == "order_number")

    op.create_table(
        "order_items",
        pk(),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("variant_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("product_variants.id"), nullable=False),
        sa.Column("product_name", sa.String(180), nullable=False),
        sa.Column("variant_sku", sa.String(120), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        *ts(),
    )
    op.create_index("ix_order_items_order_id", "order_items", ["order_id"])
    op.create_index("ix_order_items_product_id", "order_items", ["product_id"])
    op.create_index("ix_order_items_variant_id", "order_items", ["variant_id"])
    op.create_index("ix_order_items_variant_sku", "order_items", ["variant_sku"])

    op.create_table(
        "order_addresses",
        pk(),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("address_type", sa.String(30), nullable=False, server_default="shipping"),
        sa.Column("first_name", sa.String(80), nullable=False),
        sa.Column("last_name", sa.String(80), nullable=False),
        sa.Column("phone", sa.String(40), nullable=True),
        sa.Column("country", sa.String(2), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("city", sa.String(120), nullable=False),
        sa.Column("address_line1", sa.String(255), nullable=False),
        sa.Column("address_line2", sa.String(255), nullable=True),
        sa.Column("district", sa.String(120), nullable=True),
        sa.Column("postal_code", sa.String(30), nullable=False),
        *ts(),
    )
    op.create_index("ix_order_addresses_order_id", "order_addresses", ["order_id"])
    op.create_index("ix_order_addresses_country", "order_addresses", ["country"])
    op.create_index("ix_order_addresses_postal_code", "order_addresses", ["postal_code"])

    op.create_table(
        "order_status_history",
        pk(),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("from_status", sa.String(40), nullable=True),
        sa.Column("to_status", sa.String(40), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        *ts(),
    )
    op.create_index("ix_order_status_history_order_id", "order_status_history", ["order_id"])
    op.create_index("ix_order_status_history_to_status", "order_status_history", ["to_status"])


def downgrade() -> None:
    op.drop_table("order_status_history")
    op.drop_table("order_addresses")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("coupons")
    op.drop_table("shipping_methods")


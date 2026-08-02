"""phase 7 manual supplier workflow

Revision ID: 20260801_0005
Revises: 20260801_0004
Create Date: 2026-08-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260801_0005"
down_revision: str | None = "20260801_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("supplier_order_id", sa.String(120), nullable=True))
    op.add_column("orders", sa.Column("supplier_provider", sa.String(60), nullable=False, server_default="manual"))
    op.add_column("orders", sa.Column("supplier_real_cost", sa.Numeric(12, 2), nullable=True))
    op.add_column("orders", sa.Column("supplier_payload", postgresql.JSONB(), nullable=True))
    op.create_index("ix_orders_supplier_order_id", "orders", ["supplier_order_id"])
    op.create_index("ix_orders_supplier_provider", "orders", ["supplier_provider"])

    op.add_column("order_items", sa.Column("supplier_sku", sa.String(120), nullable=True))
    op.add_column("order_items", sa.Column("supplier_variant_id", sa.String(120), nullable=True))

    op.add_column("shipments", sa.Column("supplier_order_id", sa.String(120), nullable=True))
    op.create_index("ix_shipments_supplier_order_id", "shipments", ["supplier_order_id"])


def downgrade() -> None:
    op.drop_index("ix_shipments_supplier_order_id", table_name="shipments")
    op.drop_column("shipments", "supplier_order_id")
    op.drop_column("order_items", "supplier_variant_id")
    op.drop_column("order_items", "supplier_sku")
    op.drop_index("ix_orders_supplier_provider", table_name="orders")
    op.drop_index("ix_orders_supplier_order_id", table_name="orders")
    op.drop_column("orders", "supplier_payload")
    op.drop_column("orders", "supplier_real_cost")
    op.drop_column("orders", "supplier_provider")
    op.drop_column("orders", "supplier_order_id")


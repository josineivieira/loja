"""phase 4 payments and payment events

Revision ID: 20260801_0003
Revises: 20260801_0002
Create Date: 2026-08-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260801_0003"
down_revision: str | None = "20260801_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def pk() -> sa.Column:
    return sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), primary_key=True)


def ts() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    ]


def upgrade() -> None:
    op.create_table(
        "payments",
        pk(),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("gateway", sa.String(40), nullable=False, server_default="stripe"),
        sa.Column("transaction_id", sa.String(180), nullable=True),
        sa.Column("checkout_session_id", sa.String(180), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("status", sa.String(40), nullable=False, server_default="pending"),
        sa.Column("payment_url", sa.String(1000), nullable=True),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        *ts(),
    )
    for column in ["order_id", "gateway", "transaction_id", "checkout_session_id", "status"]:
        op.create_index(f"ix_payments_{column}", "payments", [column])

    op.create_table(
        "payment_events",
        pk(),
        sa.Column("payment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("payments.id"), nullable=True),
        sa.Column("gateway", sa.String(40), nullable=False, server_default="stripe"),
        sa.Column("event_id", sa.String(180), nullable=True),
        sa.Column("event_type", sa.String(120), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column("processed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("error_message", sa.Text(), nullable=True),
        *ts(),
    )
    for column in ["payment_id", "gateway", "event_type", "processed"]:
        op.create_index(f"ix_payment_events_{column}", "payment_events", [column])
    op.create_index("ix_payment_events_event_id", "payment_events", ["event_id"], unique=True)


def downgrade() -> None:
    op.drop_table("payment_events")
    op.drop_table("payments")

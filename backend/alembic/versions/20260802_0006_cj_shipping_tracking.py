"""cj shipping quote metadata

Revision ID: 20260802_0006
Revises: 20260801_0005
Create Date: 2026-08-02
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260802_0006"
down_revision: str | None = "20260801_0005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("shipping_method_name", sa.String(160), nullable=True))
    op.add_column("orders", sa.Column("shipping_min_days", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("shipping_max_days", sa.Integer(), nullable=True))
    op.add_column("orders", sa.Column("shipping_tracking_available", sa.Boolean(), nullable=False, server_default=sa.text("true")))


def downgrade() -> None:
    op.drop_column("orders", "shipping_tracking_available")
    op.drop_column("orders", "shipping_max_days")
    op.drop_column("orders", "shipping_min_days")
    op.drop_column("orders", "shipping_method_name")

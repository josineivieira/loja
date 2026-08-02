"""phase 6 engagement tracking notifications

Revision ID: 20260801_0004
Revises: 20260801_0003
Create Date: 2026-08-01
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260801_0004"
down_revision: str | None = "20260801_0003"
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
    op.create_table("wishlists", pk(), sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False), *ts())
    op.create_index("ix_wishlists_user_id", "wishlists", ["user_id"], unique=True)

    op.create_table(
        "wishlist_items",
        pk(),
        sa.Column("wishlist_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("wishlists.id"), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        *ts(),
        sa.UniqueConstraint("wishlist_id", "product_id", name="uq_wishlist_product"),
    )
    op.create_index("ix_wishlist_items_wishlist_id", "wishlist_items", ["wishlist_id"])
    op.create_index("ix_wishlist_items_product_id", "wishlist_items", ["product_id"])

    op.create_table(
        "reviews",
        pk(),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("products.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("customer_name", sa.String(160), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(160), nullable=True),
        sa.Column("comment", sa.Text(), nullable=False),
        sa.Column("status", sa.String(30), nullable=False, server_default="pending"),
        sa.Column("verified_purchase", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("admin_reply", sa.Text(), nullable=True),
        *ts(),
    )
    for col in ["product_id", "user_id", "rating", "status", "verified_purchase"]:
        op.create_index(f"ix_reviews_{col}", "reviews", [col])

    op.create_table(
        "review_images",
        pk(),
        sa.Column("review_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("reviews.id"), nullable=False),
        sa.Column("url", sa.String(700), nullable=False),
        sa.Column("alt_text", sa.String(255), nullable=True),
        *ts(),
    )
    op.create_index("ix_review_images_review_id", "review_images", ["review_id"])

    op.create_table(
        "shipments",
        pk(),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("orders.id"), nullable=False),
        sa.Column("tracking_number", sa.String(120), nullable=True),
        sa.Column("carrier", sa.String(120), nullable=True),
        sa.Column("status", sa.String(40), nullable=False, server_default="pending"),
        *ts(),
    )
    op.create_index("ix_shipments_order_id", "shipments", ["order_id"])
    op.create_index("ix_shipments_tracking_number", "shipments", ["tracking_number"])
    op.create_index("ix_shipments_status", "shipments", ["status"])

    op.create_table(
        "tracking_events",
        pk(),
        sa.Column("shipment_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("shipments.id"), nullable=False),
        sa.Column("status", sa.String(60), nullable=False),
        sa.Column("location", sa.String(180), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        *ts(),
    )
    op.create_index("ix_tracking_events_shipment_id", "tracking_events", ["shipment_id"])
    op.create_index("ix_tracking_events_status", "tracking_events", ["status"])

    op.create_table(
        "notifications",
        pk(),
        sa.Column("audience", sa.String(40), nullable=False, server_default="admin"),
        sa.Column("title", sa.String(180), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("type", sa.String(60), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("related_order_number", sa.String(40), nullable=True),
        *ts(),
    )
    for col in ["audience", "type", "read", "related_order_number"]:
        op.create_index(f"ix_notifications_{col}", "notifications", [col])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("tracking_events")
    op.drop_table("shipments")
    op.drop_table("review_images")
    op.drop_table("reviews")
    op.drop_table("wishlist_items")
    op.drop_table("wishlists")


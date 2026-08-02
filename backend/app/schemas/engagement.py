import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class WishlistItemCreate(BaseModel):
    product_id: uuid.UUID


class WishlistItemRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    product_id: uuid.UUID
    customer_name: str = Field(min_length=2, max_length=160)
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=160)
    comment: str = Field(min_length=5, max_length=3000)


class ReviewModerationUpdate(BaseModel):
    status: str = Field(pattern="^(pending|approved|rejected|hidden)$")
    admin_reply: str | None = Field(default=None, max_length=3000)


class ReviewRead(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    customer_name: str
    rating: int
    title: str | None
    comment: str
    status: str
    verified_purchase: bool
    admin_reply: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TrackingEventRead(BaseModel):
    status: str
    location: str | None
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class TrackingRead(BaseModel):
    order_number: str
    tracking_number: str | None
    carrier: str | None
    status: str
    events: list[TrackingEventRead]


class NotificationRead(BaseModel):
    id: uuid.UUID
    audience: str
    title: str
    message: str
    type: str
    read: bool
    related_order_number: str | None
    created_at: datetime

    class Config:
        from_attributes = True


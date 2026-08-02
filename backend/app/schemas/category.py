import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    name: str = Field(min_length=2, max_length=140)
    slug: str = Field(min_length=2, max_length=180)
    description: str | None = None
    image_url: str | None = None
    sort_order: int = 0
    is_active: bool = True
    parent_id: uuid.UUID | None = None
    seo_title: str | None = None
    seo_description: str | None = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=140)
    slug: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = None
    image_url: str | None = None
    sort_order: int | None = None
    is_active: bool | None = None
    parent_id: uuid.UUID | None = None
    seo_title: str | None = None
    seo_description: str | None = None


class CategoryRead(CategoryBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


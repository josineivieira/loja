from __future__ import annotations

import uuid

from decimal import Decimal

from sqlalchemy import Select, asc, desc, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.category import Category
from app.models.product import Product, ProductVariant


class CategoryRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_active(self) -> list[Category]:
        return list(self.db.scalars(select(Category).where(Category.deleted_at.is_(None)).order_by(Category.sort_order)))

    def get_by_slug(self, slug: str) -> Category | None:
        return self.db.scalar(select(Category).where(Category.slug == slug, Category.deleted_at.is_(None)))

    def create(self, category: Category) -> Category:
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update(self, category_id: uuid.UUID, values: dict) -> Category | None:
        category = self.db.get(Category, category_id)
        if not category or category.deleted_at:
            return None
        for key, value in values.items():
            setattr(category, key, value)
        self.db.commit()
        self.db.refresh(category)
        return category


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def _base_query(self) -> Select[tuple[Product]]:
        return select(Product).options(selectinload(Product.variants), selectinload(Product.images)).where(Product.deleted_at.is_(None))

    def list(
        self,
        category_slug: str | None = None,
        search: str | None = None,
        min_price: Decimal | None = None,
        max_price: Decimal | None = None,
        availability: str | None = None,
        featured: bool | None = None,
        is_new: bool | None = None,
        is_bestseller: bool | None = None,
        on_sale: bool | None = None,
        sort: str = "newest",
        limit: int = 24,
        offset: int = 0,
    ) -> list[Product]:
        statement = self._base_query().where(Product.status == "active")
        if category_slug:
            statement = statement.join(Product.category).where(Category.slug == category_slug)
        if search:
            like = f"%{search}%"
            statement = statement.where(or_(Product.name.ilike(like), Product.short_description.ilike(like), Product.sku.ilike(like)))
        if min_price is not None:
            statement = statement.where(Product.sale_price >= min_price)
        if max_price is not None:
            statement = statement.where(Product.sale_price <= max_price)
        if availability == "in_stock":
            statement = statement.join(Product.variants).where(ProductVariant.stock > 0)
        if featured is not None:
            statement = statement.where(Product.featured == featured)
        if is_new is not None:
            statement = statement.where(Product.is_new == is_new)
        if is_bestseller is not None:
            statement = statement.where(Product.is_bestseller == is_bestseller)
        if on_sale:
            statement = statement.where(Product.compare_at_price.is_not(None), Product.compare_at_price > Product.sale_price)

        sort_map = {
            "price_asc": asc(Product.sale_price),
            "price_desc": desc(Product.sale_price),
            "bestsellers": desc(Product.is_bestseller),
            "rating": desc(Product.featured),
            "newest": desc(Product.created_at),
            "relevance": desc(Product.featured),
        }
        statement = statement.order_by(sort_map.get(sort, desc(Product.created_at)), desc(Product.created_at)).limit(limit).offset(offset)
        return list(self.db.scalars(statement))

    def get_by_slug(self, slug: str) -> Product | None:
        return self.db.scalar(self._base_query().where(Product.slug == slug))

    def get(self, product_id: uuid.UUID) -> Product | None:
        return self.db.scalar(self._base_query().where(Product.id == product_id))

    def create(self, product: Product, variants: list[ProductVariant]) -> Product:
        self.db.add(product)
        self.db.flush()
        for variant in variants:
            variant.product_id = product.id
            self.db.add(variant)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(self, product_id: uuid.UUID, values: dict) -> Product | None:
        product = self.get(product_id)
        if not product or product.deleted_at:
            return None
        for key, value in values.items():
            setattr(product, key, value)
        if "sale_price" in values:
            for variant in product.variants:
                variant.price = values["sale_price"]
        if "cost_price" in values:
            for variant in product.variants:
                variant.cost = values["cost_price"]
        self.db.commit()
        self.db.refresh(product)
        return product

    def soft_delete(self, product_id: uuid.UUID) -> bool:
        product = self.get(product_id)
        if not product or product.deleted_at:
            return False
        from datetime import UTC, datetime

        product.deleted_at = datetime.now(UTC)
        self.db.commit()
        return True

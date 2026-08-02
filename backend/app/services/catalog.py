import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product, ProductVariant
from app.repositories.catalog import CategoryRepository, ProductRepository
from app.schemas.category import CategoryCreate, CategoryUpdate
from app.schemas.product import ProductCreate, ProductUpdate


class CatalogService:
    def __init__(self, db: Session):
        self.categories = CategoryRepository(db)
        self.products = ProductRepository(db)

    def list_categories(self) -> list[Category]:
        return self.categories.list_active()

    def create_category(self, payload: CategoryCreate) -> Category:
        if self.categories.get_by_slug(payload.slug):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category slug already exists")
        return self.categories.create(Category(**payload.model_dump()))

    def update_category(self, category_id: uuid.UUID, payload: CategoryUpdate) -> Category:
        category = self.categories.update(category_id, payload.model_dump(exclude_unset=True))
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return category

    def list_products(
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
        return self.products.list(
            category_slug=category_slug,
            search=search,
            min_price=min_price,
            max_price=max_price,
            availability=availability,
            featured=featured,
            is_new=is_new,
            is_bestseller=is_bestseller,
            on_sale=on_sale,
            sort=sort,
            limit=limit,
            offset=offset,
        )

    def get_product_by_slug(self, slug: str) -> Product:
        product = self.products.get_by_slug(slug)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product

    def create_product(self, payload: ProductCreate) -> Product:
        if self.products.get_by_slug(payload.slug):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product slug already exists")
        data = payload.model_dump(exclude={"variants"})
        variants = [ProductVariant(**variant.model_dump()) for variant in payload.variants]
        return self.products.create(Product(**data), variants)

    def update_product(self, product_id: uuid.UUID, payload: ProductUpdate) -> Product:
        product = self.products.update(product_id, payload.model_dump(exclude_unset=True))
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return product

    def delete_product(self, product_id: uuid.UUID) -> None:
        if not self.products.soft_delete(product_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

from typing import Annotated
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.product import ProductRead
from app.services.catalog import CatalogService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=list[ProductRead])
def list_products(
    db: Annotated[Session, Depends(get_db)],
    category: str | None = None,
    q: str | None = None,
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    availability: str | None = None,
    featured: bool | None = None,
    is_new: bool | None = None,
    is_bestseller: bool | None = None,
    on_sale: bool | None = None,
    sort: str = "newest",
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[ProductRead]:
    return CatalogService(db).list_products(
        category_slug=category,
        search=q,
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


@router.get("/search", response_model=list[ProductRead])
def search_products(
    db: Annotated[Session, Depends(get_db)],
    q: str = Query(min_length=1),
    limit: int = Query(default=24, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[ProductRead]:
    return CatalogService(db).list_products(search=q, sort="relevance", limit=limit, offset=offset)


@router.get("/{slug}", response_model=ProductRead)
def get_product(slug: str, db: Annotated[Session, Depends(get_db)]) -> ProductRead:
    return CatalogService(db).get_product_by_slug(slug)

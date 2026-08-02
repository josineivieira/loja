from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.category import CategoryRead
from app.schemas.product import ProductRead
from app.services.catalog import CatalogService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=list[CategoryRead])
def list_categories(db: Annotated[Session, Depends(get_db)]) -> list[CategoryRead]:
    return CatalogService(db).list_categories()


@router.get("/{slug}/products", response_model=list[ProductRead])
def list_category_products(slug: str, db: Annotated[Session, Depends(get_db)]) -> list[ProductRead]:
    return CatalogService(db).list_products(category_slug=slug, sort="relevance")

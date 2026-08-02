from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.checkout import OrderRead
from app.services.checkout import CheckoutService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/{order_number}", response_model=OrderRead)
def get_order(order_number: str, db: Annotated[Session, Depends(get_db)]) -> OrderRead:
    return CheckoutService(db).get_order(order_number)


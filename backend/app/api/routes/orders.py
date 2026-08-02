from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.schemas.checkout import OrderRead
from app.services.checkout import CheckoutService

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/me/list", response_model=list[OrderRead])
def my_orders(current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> list[OrderRead]:
    return CheckoutService(db).list_customer_orders(str(current_user.id))


@router.get("/{order_number}", response_model=OrderRead)
def get_order(order_number: str, db: Annotated[Session, Depends(get_db)]) -> OrderRead:
    return CheckoutService(db).get_order(order_number)

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.checkout import CheckoutCalculateRequest, CheckoutCalculationResponse, CheckoutCreateOrderRequest, OrderRead
from app.schemas.payment import PaymentSessionRequest, PaymentSessionResponse
from app.services.checkout import CheckoutService
from app.services.payments import PaymentService

router = APIRouter(prefix="/checkout", tags=["Checkout"])


@router.post("/calculate", response_model=CheckoutCalculationResponse)
def calculate_checkout(payload: CheckoutCalculateRequest, db: Annotated[Session, Depends(get_db)]) -> CheckoutCalculationResponse:
    return CheckoutService(db).calculate(payload)


@router.post("/create-order", response_model=OrderRead, status_code=201)
def create_order(payload: CheckoutCreateOrderRequest, db: Annotated[Session, Depends(get_db)]) -> OrderRead:
    return CheckoutService(db).create_order(payload)


@router.post("/payment-session", response_model=PaymentSessionResponse)
def create_payment_session(payload: PaymentSessionRequest, db: Annotated[Session, Depends(get_db)]) -> PaymentSessionResponse:
    return PaymentService(db).create_stripe_session(payload.order_number)

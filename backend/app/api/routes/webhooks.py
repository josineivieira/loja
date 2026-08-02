from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.services.payments import PaymentService

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("/stripe")
async def stripe_webhook(
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    stripe_signature: Annotated[str | None, Header(alias="Stripe-Signature")] = None,
) -> dict:
    payload = await request.body()
    return PaymentService(db).handle_stripe_webhook(payload, stripe_signature)


@router.post("/paypal")
async def paypal_webhook() -> dict:
    return {"received": True, "provider": "paypal", "status": "not_implemented"}


@router.post("/cj")
async def cj_webhook() -> dict:
    return {"received": True, "provider": "cj", "status": "reserved_for_future_integration"}

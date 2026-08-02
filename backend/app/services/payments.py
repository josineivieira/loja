from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.integrations.payment.provider import PaymentRequest
from app.integrations.payment.stripe_provider import StripePaymentProvider
from app.models.order import Payment, PaymentEvent
from app.repositories.payments import PaymentRepository
from app.schemas.payment import PaymentSessionResponse


class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PaymentRepository(db)
        self.stripe = StripePaymentProvider()

    def create_stripe_session(self, order_number: str) -> PaymentSessionResponse:
        order = self.repo.get_order(order_number)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        if order.payment_status == "paid":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order is already paid")

        result = self.stripe.create_payment(
            PaymentRequest(
                order_number=order.order_number,
                amount=Decimal(order.total_amount),
                currency=order.currency,
                customer_email=order.customer_email,
                metadata={"order_id": str(order.id)},
            )
        )
        payment = Payment(
            order_id=order.id,
            gateway="stripe",
            checkout_session_id=result.get("checkout_session_id"),
            amount=order.total_amount,
            currency=order.currency,
            status="pending",
            payment_url=result.get("payment_url"),
            payload=result,
        )
        self.repo.create_payment(payment)
        return PaymentSessionResponse(
            order_number=order.order_number,
            gateway="stripe",
            status="pending",
            amount=order.total_amount,
            currency=order.currency,
            checkout_session_id=result.get("checkout_session_id"),
            payment_url=result.get("payment_url"),
            mode=result.get("mode", "test"),
        )

    def handle_stripe_webhook(self, payload: bytes, signature: str | None) -> dict[str, Any]:
        event = self.stripe.handle_webhook(payload, signature)
        event_id = event.get("id")
        event_type = event.get("type", "unknown")
        if event_id and self.repo.get_event(event_id):
            return {"received": True, "duplicate": True}

        payment_event = PaymentEvent(gateway="stripe", event_id=event_id, event_type=event_type, payload=event, processed=False)
        self.repo.save_event(payment_event)

        data_object = event.get("data", {}).get("object", {})
        if event_type == "checkout.session.completed":
            self._handle_checkout_completed(data_object, event)
            payment_event.processed = True
            self.db.commit()
        elif event_type in {"payment_intent.payment_failed", "checkout.session.expired"}:
            self._handle_payment_failed(data_object, event)
            payment_event.processed = True
            self.db.commit()

        return {"received": True, "event_type": event_type}

    def _handle_checkout_completed(self, session: dict[str, Any], event: dict[str, Any]) -> None:
        order_number = session.get("metadata", {}).get("order_number")
        checkout_session_id = session.get("id")
        transaction_id = session.get("payment_intent")
        if not order_number:
            return
        order = self.repo.get_order(order_number)
        if not order:
            return
        payment = self.repo.get_payment_by_session(checkout_session_id) if checkout_session_id else None
        self.repo.mark_paid(order, payment, transaction_id, event)

    def _handle_payment_failed(self, obj: dict[str, Any], event: dict[str, Any]) -> None:
        order_number = obj.get("metadata", {}).get("order_number")
        if not order_number:
            return
        order = self.repo.get_order(order_number)
        if not order:
            return
        payment = None
        checkout_session_id = obj.get("id") if obj.get("object") == "checkout.session" else None
        if checkout_session_id:
            payment = self.repo.get_payment_by_session(checkout_session_id)
        self.repo.mark_failed(order, payment, event, obj.get("last_payment_error", {}).get("message"))


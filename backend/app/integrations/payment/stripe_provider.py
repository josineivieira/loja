import json
from decimal import Decimal
from typing import Any

import stripe

from app.core.config import settings
from app.integrations.payment.provider import PaymentProvider, PaymentRequest


class StripePaymentProvider(PaymentProvider):
    def create_payment(self, request: PaymentRequest) -> dict[str, Any]:
        if not settings.stripe_secret_key:
            return {
                "gateway": "stripe",
                "mode": "test_placeholder",
                "status": "pending",
                "checkout_session_id": f"cs_test_placeholder_{request.order_number}",
                "payment_url": None,
                "amount": str(request.amount),
                "currency": request.currency,
                "order_number": request.order_number,
            }

        stripe.api_key = settings.stripe_secret_key
        session = stripe.checkout.Session.create(
            mode="payment",
            success_url=f"{settings.frontend_url}/order-confirmation?order={request.order_number}&payment=success",
            cancel_url=f"{settings.frontend_url}/orders/{request.order_number}?payment=cancelled",
            customer_email=request.customer_email,
            line_items=[
                {
                    "price_data": {
                        "currency": request.currency.lower(),
                        "product_data": {"name": f"Nexora order {request.order_number}"},
                        "unit_amount": int(request.amount * Decimal("100")),
                    },
                    "quantity": 1,
                }
            ],
            metadata={"order_number": request.order_number, **request.metadata},
            payment_intent_data={"metadata": {"order_number": request.order_number, **request.metadata}},
        )
        return {
            "gateway": "stripe",
            "mode": "test",
            "status": "pending",
            "checkout_session_id": session.id,
            "payment_url": session.url,
            "amount": str(request.amount),
            "currency": request.currency,
            "order_number": request.order_number,
        }

    def confirm_payment(self, payment_id: str) -> dict[str, Any]:
        return {"gateway": "stripe", "payment_id": payment_id, "status": "processing"}

    def cancel_payment(self, payment_id: str) -> dict[str, Any]:
        return {"gateway": "stripe", "payment_id": payment_id, "status": "cancelled"}

    def refund_payment(self, payment_id: str, amount: Decimal | None = None) -> dict[str, Any]:
        return {"gateway": "stripe", "payment_id": payment_id, "amount": str(amount) if amount else None, "status": "refunded"}

    def get_payment_status(self, payment_id: str) -> str:
        return "pending"

    def handle_webhook(self, payload: bytes, signature: str | None) -> dict[str, Any]:
        if settings.stripe_webhook_secret:
            if not signature:
                raise ValueError("Missing Stripe-Signature header")
            event = stripe.Webhook.construct_event(payload, signature, settings.stripe_webhook_secret)
            return event.to_dict_recursive()

        event = stripe.Event.construct_from(json.loads(payload.decode("utf-8")), settings.stripe_secret_key or "sk_test_placeholder")
        return event.to_dict_recursive()

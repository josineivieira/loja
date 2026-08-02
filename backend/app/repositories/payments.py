from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderStatusHistory, Payment, PaymentEvent


class PaymentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_order(self, order_number: str) -> Order | None:
        statement = select(Order).options(selectinload(Order.payments), selectinload(Order.items)).where(Order.order_number == order_number)
        return self.db.scalar(statement)

    def get_payment_by_session(self, checkout_session_id: str) -> Payment | None:
        return self.db.scalar(select(Payment).where(Payment.checkout_session_id == checkout_session_id))

    def get_event(self, event_id: str) -> PaymentEvent | None:
        return self.db.scalar(select(PaymentEvent).where(PaymentEvent.event_id == event_id))

    def create_payment(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.commit()
        self.db.refresh(payment)
        return payment

    def save_event(self, event: PaymentEvent) -> PaymentEvent:
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def mark_paid(self, order: Order, payment: Payment | None, transaction_id: str | None, payload: dict) -> None:
        previous = order.status
        order.status = "paid"
        order.payment_status = "paid"
        order.fulfillment_status = "processing"
        if payment:
            payment.status = "paid"
            payment.transaction_id = transaction_id
            payment.payload = payload
        order.history.append(OrderStatusHistory(from_status=previous, to_status="paid", note="Payment confirmed by Stripe webhook"))
        self.db.commit()

    def mark_failed(self, order: Order, payment: Payment | None, payload: dict, error_message: str | None = None) -> None:
        previous = order.status
        order.status = "awaiting_payment"
        order.payment_status = "failed"
        if payment:
            payment.status = "failed"
            payment.payload = payload
            payment.error_message = error_message
        order.history.append(OrderStatusHistory(from_status=previous, to_status="awaiting_payment", note="Payment failed in Stripe"))
        self.db.commit()


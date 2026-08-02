from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal
from typing import Any


@dataclass(frozen=True)
class PaymentRequest:
    order_number: str
    amount: Decimal
    currency: str
    customer_email: str
    metadata: dict[str, str]


class PaymentProvider(ABC):
    @abstractmethod
    def create_payment(self, request: PaymentRequest) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def confirm_payment(self, payment_id: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def cancel_payment(self, payment_id: str) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def refund_payment(self, payment_id: str, amount: Decimal | None = None) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    def get_payment_status(self, payment_id: str) -> str:
        raise NotImplementedError

    @abstractmethod
    def handle_webhook(self, payload: bytes, signature: str | None) -> dict[str, Any]:
        raise NotImplementedError


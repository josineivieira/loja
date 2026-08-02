from abc import ABC, abstractmethod
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class ShippingQuoteRequest:
    destination_country: str
    subtotal: Decimal
    weight: Decimal
    currency: str = "USD"


class ShippingProvider(ABC):
    @abstractmethod
    def calculate_shipping(self, request: ShippingQuoteRequest) -> list[dict]:
        raise NotImplementedError


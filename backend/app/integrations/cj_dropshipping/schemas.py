from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class SupplierOrderResult:
    supplier_order_id: str | None
    status: str
    real_cost: Decimal | None = None
    tracking_number: str | None = None


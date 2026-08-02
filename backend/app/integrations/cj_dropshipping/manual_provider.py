from typing import Any

from app.integrations.cj_dropshipping.provider import SupplierProvider


class ManualSupplierProvider(SupplierProvider):
    def authenticate(self) -> bool:
        return True

    def search_products(self, query: str) -> list[dict[str, Any]]:
        return []

    def get_product(self, supplier_product_id: str) -> dict[str, Any]:
        return {"supplier_product_id": supplier_product_id, "mode": "manual"}

    def get_variants(self, supplier_product_id: str) -> list[dict[str, Any]]:
        return []

    def get_inventory(self, supplier_variant_id: str) -> dict[str, Any]:
        return {"supplier_variant_id": supplier_variant_id, "stock": None, "mode": "manual"}

    def calculate_shipping(self, payload: dict[str, Any]) -> dict[str, Any]:
        return {"status": "manual_quote_required", "payload": payload}

    def create_supplier_order(self, order_payload: dict[str, Any]) -> dict[str, Any]:
        return {"supplier_status": "supplier_pending", "copyable_payload": order_payload}

    def get_supplier_order(self, supplier_order_id: str) -> dict[str, Any]:
        return {"supplier_order_id": supplier_order_id, "status": "manual"}

    def cancel_supplier_order(self, supplier_order_id: str) -> dict[str, Any]:
        return {"supplier_order_id": supplier_order_id, "status": "cancel_requested"}

    def get_tracking(self, tracking_number: str) -> dict[str, Any]:
        return {"tracking_number": tracking_number, "events": []}

    def sync_product(self, supplier_product_id: str) -> dict[str, Any]:
        return {"supplier_product_id": supplier_product_id, "synced": False, "mode": "manual"}

    def sync_stock(self, supplier_variant_id: str) -> dict[str, Any]:
        return {"supplier_variant_id": supplier_variant_id, "synced": False, "mode": "manual"}


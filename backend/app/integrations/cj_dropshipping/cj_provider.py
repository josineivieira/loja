from decimal import Decimal
from typing import Any

from app.core.config import settings
from app.integrations.cj_dropshipping.client import CJDropshippingClient
from app.integrations.cj_dropshipping.exceptions import CJDropshippingError
from app.integrations.cj_dropshipping.provider import SupplierProvider


class CJDropshippingProvider(SupplierProvider):
    def __init__(self, client: CJDropshippingClient | None = None) -> None:
        self.client = client or CJDropshippingClient()

    def authenticate(self) -> bool:
        self.client.access_token()
        return True

    def search_products(self, query: str) -> list[dict[str, Any]]:
        result = self.client.get("/api2.0/v1/product/list", {"productName": query})
        data = result.get("data") or {}
        return data.get("list") or data.get("content") or []

    def get_product(self, supplier_product_id: str) -> dict[str, Any]:
        result = self.client.get("/api2.0/v1/product/query", {"pid": supplier_product_id})
        return result.get("data") or result

    def get_variants(self, supplier_product_id: str) -> list[dict[str, Any]]:
        product = self.get_product(supplier_product_id)
        return product.get("variants") or product.get("variantList") or []

    def get_inventory(self, supplier_variant_id: str) -> dict[str, Any]:
        result = self.client.get("/api2.0/v1/product/stock/query", {"vid": supplier_variant_id})
        return result.get("data") or result

    def calculate_shipping(self, payload: dict[str, Any]) -> dict[str, Any]:
        result = self.client.post("/api2.0/v1/logistic/freightCalculate", payload)
        return {"quotes": self._normalize_shipping_quotes(result.get("data") or result), "raw": result}

    def create_supplier_order(self, order_payload: dict[str, Any]) -> dict[str, Any]:
        cj_payload = self._to_cj_order(order_payload)
        path = "/api2.0/v1/shopping/order/createOrderV3"
        if settings.cj_sandbox:
            path = "/api2.0/v1/shopping/order/createOrderV3Sandbox"
        result = self.client.post(path, cj_payload)
        data = result.get("data") or {}
        supplier_order_id = data.get("orderId") or data.get("id") or data.get("orderNumber") or data.get("cjOrderId")
        return {
            "supplier_status": "supplier_confirmed" if supplier_order_id else "supplier_submitted",
            "supplier_order_id": supplier_order_id,
            "copyable_payload": cj_payload,
            "provider_response": result,
        }

    def get_supplier_order(self, supplier_order_id: str) -> dict[str, Any]:
        result = self.client.get("/api2.0/v1/shopping/order/getOrderDetail", {"orderId": supplier_order_id})
        return result.get("data") or result

    def cancel_supplier_order(self, supplier_order_id: str) -> dict[str, Any]:
        result = self.client.post("/api2.0/v1/shopping/order/deleteOrder", {"orderId": supplier_order_id})
        return result.get("data") or result

    def get_tracking(self, tracking_number: str) -> dict[str, Any]:
        result = self.client.get("/api2.0/v1/logistic/trackInfo", {"trackNumber": tracking_number})
        return result.get("data") or result

    def sync_product(self, supplier_product_id: str) -> dict[str, Any]:
        return self.get_product(supplier_product_id)

    def sync_stock(self, supplier_variant_id: str) -> dict[str, Any]:
        return self.get_inventory(supplier_variant_id)

    def _to_cj_order(self, order_payload: dict[str, Any]) -> dict[str, Any]:
        address = order_payload.get("shippingAddress") or {}
        items = []
        for item in order_payload.get("items", []):
            variant_id = item.get("supplierVariantId")
            if not variant_id:
                raise CJDropshippingError("Every item needs supplierVariantId from CJ before automatic supplier submission.")
            items.append(
                {
                    "vid": variant_id,
                    "quantity": item.get("quantity", 1),
                }
            )
        if not items:
            raise CJDropshippingError("CJ order requires at least one item.")
        return {
            "orderNumber": order_payload.get("orderNumber"),
            "shippingZip": address.get("postalCode"),
            "shippingCountryCode": address.get("country"),
            "shippingCountry": address.get("country"),
            "shippingProvince": address.get("state"),
            "shippingCity": address.get("city"),
            "shippingAddress": address.get("addressLine1"),
            "shippingAddress2": address.get("addressLine2"),
            "shippingCustomerName": f"{address.get('firstName', '')} {address.get('lastName', '')}".strip(),
            "shippingPhone": address.get("phone"),
            "logisticName": settings.cj_default_logistic_name,
            "fromCountryCode": settings.cj_default_from_country,
            "remark": order_payload.get("notes") or "",
            "products": items,
        }

    def _normalize_shipping_quotes(self, data: Any) -> list[dict[str, Any]]:
        if isinstance(data, dict):
            candidates = data.get("list") or data.get("logisticList") or data.get("freightList") or data.get("shippingMethods") or data.get("routes")
        else:
            candidates = data
        if not isinstance(candidates, list):
            candidates = [data] if isinstance(data, dict) else []
        quotes: list[dict[str, Any]] = []
        for item in candidates:
            if not isinstance(item, dict):
                continue
            name = item.get("logisticName") or item.get("shippingName") or item.get("name") or item.get("channelName") or settings.cj_default_logistic_name
            amount = item.get("logisticPrice") or item.get("shippingFee") or item.get("freight") or item.get("price") or item.get("amount")
            try:
                amount_decimal = Decimal(str(amount or "0"))
            except Exception:
                amount_decimal = Decimal("0")
            min_days = int(item.get("minDeliveryDay") or item.get("minDay") or item.get("deliveryMin") or item.get("aging") or 7)
            max_days = int(item.get("maxDeliveryDay") or item.get("maxDay") or item.get("deliveryMax") or item.get("aging") or min_days + 7)
            quotes.append(
                {
                    "code": f"cj_{str(name).lower().replace(' ', '_')[:50]}",
                    "name": str(name),
                    "amount": amount_decimal,
                    "currency": str(item.get("currency") or "USD").upper(),
                    "min_days": min_days,
                    "max_days": max_days,
                    "tracking_available": True,
                }
            )
        return quotes

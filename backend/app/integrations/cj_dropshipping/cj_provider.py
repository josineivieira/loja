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
        normalized = query.strip()
        results: list[dict[str, Any]] = []
        is_cj_identifier = normalized.upper().startswith(("CJ", "CJAM", "CJJT", "CJST", "CJNS", "CJLY", "CJQC"))
        if is_cj_identifier:
            for identifier in self._product_identifier_candidates(normalized):
                try:
                    product = self.get_product(identifier)
                    if isinstance(product, dict) and product:
                        results.append(product)
                except CJDropshippingError:
                    pass
            exact_results = [product for product in self._dedupe_products(results) if self._product_matches_query(product, normalized)]
            if exact_results:
                return exact_results
            results = []
        attempts = [
            {"sku": normalized},
            {"productSku": normalized},
            {"variantSku": normalized},
            {"productNum": normalized},
            {"pid": normalized},
            {"vid": normalized},
        ]
        if not is_cj_identifier:
            attempts.insert(0, {"productName": normalized})
        for params in attempts:
            try:
                result = self.client.get("/api2.0/v1/product/list", params)
            except CJDropshippingError:
                continue
            data = result.get("data") or {}
            rows = data.get("list") or data.get("content") or []
            if isinstance(rows, list):
                results.extend([row for row in rows if isinstance(row, dict)])
        deduped = self._dedupe_products(results)
        if is_cj_identifier:
            return [product for product in deduped if self._product_matches_query(product, normalized)]
        return deduped

    def get_product(self, supplier_product_id: str) -> dict[str, Any]:
        last_error: CJDropshippingError | None = None
        for params in ({"pid": supplier_product_id}, {"sku": supplier_product_id}, {"productSku": supplier_product_id}, {"variantSku": supplier_product_id}, {"vid": supplier_product_id}):
            try:
                result = self.client.get("/api2.0/v1/product/query", params)
            except CJDropshippingError as exc:
                last_error = exc
                continue
            data = result.get("data") or result
            if isinstance(data, dict) and data:
                return data
        if last_error:
            raise last_error
        return {}

    def _product_identifier_candidates(self, value: str) -> list[str]:
        normalized = value.strip()
        candidates = [normalized]
        for length in (11, 10, 12):
            if len(normalized) > length:
                candidates.append(normalized[:length])
        if len(normalized) > 4:
            candidates.append(normalized[:-4])
        if len(normalized) > 2:
            candidates.append(normalized[:-2])
        return list(dict.fromkeys(candidates))

    def _product_matches_query(self, product: dict[str, Any], query: str) -> bool:
        needle = query.strip().upper()
        values: list[str] = []
        for key in ("pid", "productId", "id", "productSku", "sku", "productNum", "vid", "variantId"):
            value = product.get(key)
            if value:
                values.append(str(value).upper())
        variants = product.get("variants") or product.get("variantList") or product.get("variantsList") or product.get("productVariantList") or []
        if isinstance(variants, list):
            for variant in variants:
                if not isinstance(variant, dict):
                    continue
                for key in ("vid", "variantId", "id", "variantSku", "sku", "variantKey", "variantName", "variantNameEn"):
                    value = variant.get(key)
                    if value:
                        values.append(str(value).upper())
        return any(needle == value or needle in value for value in values)

    def _dedupe_products(self, products: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen: set[str] = set()
        deduped: list[dict[str, Any]] = []
        for product in products:
            key = str(product.get("pid") or product.get("productId") or product.get("id") or product.get("vid") or product.get("variantId") or product)
            if key in seen:
                continue
            seen.add(key)
            deduped.append(product)
        return deduped

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
        data = result.get("data") or result
        return {"order": self._normalize_supplier_order(data), "raw": result}

    def cancel_supplier_order(self, supplier_order_id: str) -> dict[str, Any]:
        result = self.client.post("/api2.0/v1/shopping/order/deleteOrder", {"orderId": supplier_order_id})
        return result.get("data") or result

    def get_tracking(self, tracking_number: str) -> dict[str, Any]:
        result = self.client.get("/api2.0/v1/logistic/trackInfo", {"trackNumber": tracking_number})
        data = result.get("data") or result
        return {"tracking": self._normalize_tracking(data), "raw": result}

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
            "logisticName": self._logistic_name(order_payload.get("shippingMethod"), order_payload.get("shippingMethodName")),
            "fromCountryCode": settings.cj_default_from_country,
            "remark": order_payload.get("notes") or "",
            "products": items,
        }

    def _logistic_name(self, method_code: str | None, method_name: str | None) -> str:
        name = method_name or method_code or settings.cj_default_logistic_name
        if name.startswith("CJ "):
            name = name[3:]
        return name.replace("cj_", "").replace("_", " ").strip() or settings.cj_default_logistic_name

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
                    "logistic_name": str(name),
                    "amount": amount_decimal,
                    "currency": str(item.get("currency") or "USD").upper(),
                    "min_days": min_days,
                    "max_days": max_days,
                    "tracking_available": True,
                }
            )
        return quotes

    def _normalize_supplier_order(self, data: Any) -> dict[str, Any]:
        source = data[0] if isinstance(data, list) and data else data
        if not isinstance(source, dict):
            return {}
        tracking_number = self._first_present(source, "trackingNumber", "trackNumber", "logisticTrackingNumber", "shippingNumber")
        carrier = self._first_present(source, "logisticName", "shippingName", "carrier", "carrierName")
        status = self._first_present(source, "orderStatus", "status", "logisticStatus", "fulfillmentStatus") or "supplier_confirmed"
        min_days = self._safe_int(self._first_present(source, "minDeliveryDay", "minDay", "deliveryMin"))
        max_days = self._safe_int(self._first_present(source, "maxDeliveryDay", "maxDay", "deliveryMax"))
        return {
            "supplier_status": str(status),
            "tracking_number": str(tracking_number) if tracking_number else None,
            "carrier": str(carrier) if carrier else None,
            "min_days": min_days,
            "max_days": max_days,
            "events": self._normalize_tracking_events(source),
        }

    def _normalize_tracking(self, data: Any) -> dict[str, Any]:
        source = data[0] if isinstance(data, list) and data else data
        if not isinstance(source, dict):
            return {"events": []}
        return {
            "status": self._first_present(source, "status", "logisticStatus", "trackStatus"),
            "events": self._normalize_tracking_events(source),
        }

    def _normalize_tracking_events(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        candidates = self._first_present(data, "events", "trackInfo", "trackInfoList", "trackingList", "logisticsInfo")
        if not isinstance(candidates, list):
            return []
        events: list[dict[str, Any]] = []
        for item in candidates:
            if not isinstance(item, dict):
                continue
            events.append(
                {
                    "status": str(self._first_present(item, "status", "trackStatus", "logisticStatus") or "in_transit"),
                    "location": self._first_present(item, "location", "trackLocation", "city"),
                    "description": str(self._first_present(item, "description", "trackDetail", "message", "content") or "CJ tracking update."),
                }
            )
        return events

    def _first_present(self, data: dict[str, Any], *keys: str) -> Any:
        for key in keys:
            value = data.get(key)
            if value is not None and value != "":
                return value
        return None

    def _safe_int(self, value: Any) -> int | None:
        try:
            return int(value) if value is not None and value != "" else None
        except Exception:
            return None

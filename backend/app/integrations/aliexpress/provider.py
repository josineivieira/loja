from decimal import Decimal
from typing import Any

from app.integrations.aliexpress.client import AliExpressClient
from app.integrations.aliexpress.exceptions import AliExpressError


class AliExpressProvider:
    def __init__(self, client: AliExpressClient | None = None) -> None:
        self.client = client or AliExpressClient()

    def search_products(self, query: str) -> list[dict[str, Any]]:
        query = query.strip()
        if not query:
            return []
        product_id = self._extract_product_id(query)
        if product_id:
            try:
                return [self.get_product(product_id)]
            except AliExpressError:
                pass
        responses: list[dict[str, Any]] = []
        errors: list[str] = []
        for keyword in self._query_keywords(query):
            try:
                data = self.client.ds_method(
                    "aliexpress.ds.recommend.feed.get",
                    {
                        "target_language": "pt_BR",
                        "target_currency": "BRL",
                        "country": "BR",
                        "feed_name": "DS bestseller",
                        "page_no": 1,
                        "page_size": 50,
                    },
                )
                responses.extend(self._filter_products(self._product_rows(data), keyword))
            except AliExpressError as exc:
                errors.append(str(exc))
        deduped = self._dedupe(responses)
        if deduped:
            return deduped
        if errors:
            raise AliExpressError(errors[-1])
        return []

    def get_product(self, product_id: str) -> dict[str, Any]:
        payload = {
            "product_id": product_id,
            "target_language": "pt_BR",
            "target_currency": "BRL",
            "ship_to_country": "BR",
        }
        errors: list[str] = []
        for method in ("aliexpress.ds.product.get", "aliexpress.ds.product.simplequery"):
            try:
                data = self.client.ds_method(method, payload)
            except AliExpressError as exc:
                errors.append(str(exc))
                continue
            product = self._first_product(data)
            if product:
                return product
        raise AliExpressError(errors[-1] if errors else "AliExpress product was not found.")

    def calculate_shipping(self, payload: dict[str, Any]) -> dict[str, Any]:
        request_payload = {
            "product_id": payload.get("product_id") or payload.get("supplierProductId"),
            "sku_attr": payload.get("sku_attr") or payload.get("supplierVariantId") or payload.get("vid"),
            "quantity": payload.get("quantity", 1),
            "ship_to_country": payload.get("country") or payload.get("endCountryCode") or payload.get("shippingCountryCode"),
            "province": payload.get("state") or payload.get("shippingProvince"),
            "city": payload.get("city") or payload.get("shippingCity"),
            "zip": payload.get("postal_code") or payload.get("shippingZip"),
            "target_currency": payload.get("currency", "USD"),
            "locale": "pt_BR",
        }
        errors: list[str] = []
        for method in ("aliexpress.ds.freight.query", "aliexpress.logistics.buyer.freight.get"):
            try:
                data = self.client.ds_method(method, request_payload)
            except AliExpressError as exc:
                errors.append(str(exc))
                continue
            quotes = self._shipping_rows(data)
            if quotes:
                return {"quotes": quotes, "raw": data}
        raise AliExpressError(errors[-1] if errors else "AliExpress did not return shipping options.")

    def create_supplier_order(self, order_payload: dict[str, Any]) -> dict[str, Any]:
        payload = self._to_order_payload(order_payload)
        if order_payload.get("sandbox"):
            return {"supplier_status": "supplier_submitted", "supplier_order_id": None, "copyable_payload": payload, "provider_response": {"sandbox": True}}
        data = self.client.ds_method("aliexpress.ds.order.create", payload)
        supplier_order_id = self._first_present(data, "order_id", "orderId", "id")
        result = data.get("result")
        if not supplier_order_id and isinstance(result, dict):
            supplier_order_id = self._first_present(result, "order_id", "orderId", "id")
        return {
            "supplier_status": "supplier_confirmed" if supplier_order_id else "supplier_submitted",
            "supplier_order_id": str(supplier_order_id) if supplier_order_id else None,
            "copyable_payload": payload,
            "provider_response": data,
        }

    def get_supplier_order(self, supplier_order_id: str) -> dict[str, Any]:
        data = self.client.ds_method("aliexpress.ds.order.get", {"order_id": supplier_order_id})
        return {"order": self._normalize_order(data), "raw": data}

    def get_tracking(self, supplier_order_id: str) -> dict[str, Any]:
        data = self.client.ds_method("aliexpress.ds.order.tracking.get", {"order_id": supplier_order_id})
        return {"tracking": self._normalize_tracking(data), "raw": data}

    def _to_order_payload(self, order_payload: dict[str, Any]) -> dict[str, Any]:
        address = order_payload.get("shippingAddress") or {}
        items = []
        for item in order_payload.get("items", []):
            supplier_variant_id = item.get("supplierVariantId")
            supplier_sku = item.get("supplierSku")
            if not supplier_variant_id and not supplier_sku:
                raise AliExpressError("Every AliExpress order item needs supplier variant data.")
            items.append(
                {
                    "product_id": item.get("supplierProductId") or item.get("supplierSku"),
                    "sku_attr": supplier_variant_id,
                    "quantity": item.get("quantity", 1),
                }
            )
        return {
            "logistics_address": {
                "contact_person": f"{address.get('firstName', '')} {address.get('lastName', '')}".strip(),
                "mobile_no": address.get("phone"),
                "country": address.get("country"),
                "province": address.get("state"),
                "city": address.get("city"),
                "address": address.get("addressLine1"),
                "address2": address.get("addressLine2"),
                "zip": address.get("postalCode"),
            },
            "logistics_service_name": order_payload.get("shippingMethodName") or order_payload.get("shippingMethod"),
            "product_items": items,
        }

    def _product_rows(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        source: Any = data
        for key in (
            "aliexpress_ds_recommend_feed_get_response",
            "aliexpress_ds_product_get_response",
            "aliexpress_ds_product_simplequery_response",
            "result",
            "resp_result",
        ):
            if isinstance(source, dict) and isinstance(source.get(key), (dict, list)):
                source = source[key]
        if isinstance(source, dict):
            rows = source.get("products") or source.get("product_list") or source.get("aeopAEProductDisplayDTOList") or source.get("items") or source.get("ae_item_base_info_dto")
            if isinstance(rows, dict):
                rows = rows.get("item") or rows.get("product")
            if isinstance(rows, list):
                return [row for row in rows if isinstance(row, dict)]
            if self._first_present(source, "product_id", "productId", "ae_product_id") or isinstance(source.get("ae_item_base_info_dto"), dict):
                return [self._flatten_product(source)]
        return []

    def _first_product(self, data: dict[str, Any]) -> dict[str, Any]:
        rows = self._product_rows(data)
        return rows[0] if rows else {}

    def _shipping_rows(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        source: Any = data
        for key in ("result", "resp_result", "logistics_result"):
            if isinstance(source, dict) and isinstance(source.get(key), (dict, list)):
                source = source[key]
        candidates = source.get("freight") or source.get("shipping_methods") or source.get("aeop_freight_calculate_result_for_buyer_d_t_o") if isinstance(source, dict) else source
        if isinstance(candidates, dict):
            candidates = candidates.get("freight") or candidates.get("list") or candidates.get("shipping_method")
        if not isinstance(candidates, list):
            candidates = [source] if isinstance(source, dict) else []
        quotes: list[dict[str, Any]] = []
        for item in candidates:
            if not isinstance(item, dict):
                continue
            name = self._first_present(item, "service_name", "company", "logistics_service_name", "shipping_method", "name") or "AliExpress Standard Shipping"
            amount = self._decimal(self._first_present(item, "freight_amount", "amount", "price", "shipping_fee", "delivery_fee"), Decimal("0"))
            if amount <= 0:
                continue
            min_days = self._safe_int(self._first_present(item, "delivery_min_days", "min_delivery_day", "min_days", "estimated_delivery_time_min")) or 10
            max_days = self._safe_int(self._first_present(item, "delivery_max_days", "max_delivery_day", "max_days", "estimated_delivery_time_max")) or max(min_days, 25)
            code = str(self._first_present(item, "service_name", "logistics_service_name", "code", "shipping_method") or name).lower().replace(" ", "_")[:70]
            quotes.append(
                {
                    "code": f"aliexpress_{code}",
                    "name": str(name),
                    "amount": amount,
                    "currency": str(self._first_present(item, "currency", "currency_code") or "USD").upper(),
                    "min_days": min_days,
                    "max_days": max_days,
                    "tracking_available": bool(self._first_present(item, "tracking", "tracking_available", "trackingAvailable") or True),
                }
            )
        return quotes

    def _normalize_order(self, data: dict[str, Any]) -> dict[str, Any]:
        tracking = self._first_present(data, "tracking_number", "trackingNumber", "logistics_no")
        return {
            "supplier_status": str(self._first_present(data, "order_status", "status", "logistics_status") or "supplier_confirmed"),
            "tracking_number": str(tracking) if tracking else None,
            "carrier": self._first_present(data, "carrier", "logistics_service_name", "shipping_method"),
            "events": self._tracking_events(data),
        }

    def _normalize_tracking(self, data: dict[str, Any]) -> dict[str, Any]:
        return {"status": str(self._first_present(data, "status", "logistics_status") or "in_transit"), "events": self._tracking_events(data)}

    def _tracking_events(self, data: dict[str, Any]) -> list[dict[str, Any]]:
        rows = self._first_present(data, "events", "tracking_list", "details", "logistics_track_list")
        if not isinstance(rows, list):
            return []
        events = []
        for item in rows:
            if isinstance(item, dict):
                events.append(
                    {
                        "status": str(self._first_present(item, "status", "event_status") or "in_transit"),
                        "location": self._first_present(item, "location", "event_location"),
                        "description": str(self._first_present(item, "description", "event_desc", "desc") or "Atualizacao de rastreio AliExpress."),
                    }
                )
        return events

    def _dedupe(self, products: list[dict[str, Any]]) -> list[dict[str, Any]]:
        seen: set[str] = set()
        result = []
        for product in products:
            key = str(self._first_present(product, "product_id", "productId", "ae_product_id", "id") or product)
            if key in seen:
                continue
            seen.add(key)
            result.append(product)
        return result

    def _flatten_product(self, product: dict[str, Any]) -> dict[str, Any]:
        base = product.get("ae_item_base_info_dto")
        if isinstance(base, dict):
            flattened = {**base, **product}
            skus = product.get("ae_item_sku_info_dtos")
            if isinstance(skus, dict):
                flattened["ae_item_sku_info_dtos"] = skus.get("ae_item_sku_info_d_t_o") or skus.get("item") or skus
            return flattened
        return product

    def _extract_product_id(self, query: str) -> str | None:
        if query.isdigit() and len(query) >= 8:
            return query
        import re

        match = re.search(r"(?:item|product|/)(\d{8,})", query)
        return match.group(1) if match else None

    def _query_keywords(self, query: str) -> list[str]:
        normalized = query.strip().lower()
        dictionary = {
            "garrafa": "water bottle",
            "copo": "water bottle",
            "portatil": "portable",
            "portátil": "portable",
            "ventilador": "neck fan",
            "pescoço": "neck fan",
            "pescoco": "neck fan",
            "carregador": "charger",
            "aspirador": "vacuum cleaner",
            "celular": "phone",
        }
        translated = normalized
        for source, target in dictionary.items():
            translated = translated.replace(source, target)
        pieces = [query, translated, "portable water bottle", "neck fan", "phone accessories"]
        return list(dict.fromkeys([piece.strip() for piece in pieces if piece.strip()]))

    def _filter_products(self, products: list[dict[str, Any]], keyword: str) -> list[dict[str, Any]]:
        needles = [part for part in keyword.lower().replace("/", " ").split() if len(part) >= 3]
        if not needles:
            return products
        matched = []
        for product in products:
            haystack = " ".join(str(value) for value in product.values() if isinstance(value, (str, int, float))).lower()
            if any(needle in haystack for needle in needles):
                matched.append(product)
        return matched or products[:12]

    def _first_present(self, data: dict[str, Any], *keys: str) -> Any:
        for key in keys:
            value = data.get(key)
            if value not in (None, ""):
                return value
        return None

    def _decimal(self, value: Any, fallback: Decimal) -> Decimal:
        try:
            if isinstance(value, dict):
                value = value.get("value") or value.get("amount")
            return Decimal(str(value).replace("$", "").strip()) if value not in (None, "") else fallback
        except Exception:
            return fallback

    def _safe_int(self, value: Any) -> int | None:
        try:
            return int(value) if value not in (None, "") else None
        except Exception:
            return None

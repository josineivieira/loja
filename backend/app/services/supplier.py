import re
import uuid
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.integrations.cj_dropshipping.cj_provider import CJDropshippingProvider
from app.integrations.cj_dropshipping.exceptions import CJDropshippingError
from app.integrations.cj_dropshipping.manual_provider import ManualSupplierProvider
from app.models.order import Order
from app.models.product import Product, ProductImage, ProductVariant
from app.models.supplier import Supplier
from app.repositories.supplier import SupplierRepository
from app.schemas.supplier import (
    SupplierOrderItemRead,
    SupplierOrderPayloadRead,
    SupplierProductImportRequest,
    SupplierProductRead,
    SupplierProductVariantRead,
    SupplierSubmissionUpdate,
    SupplierTrackingUpdate,
)


class SupplierService:
    def __init__(self, db: Session):
        self.repo = SupplierRepository(db)
        self.provider = CJDropshippingProvider() if settings.supplier_provider.lower() == "cj" else ManualSupplierProvider()

    def list_pending(self) -> list[Order]:
        return self.repo.list_pending_orders()

    def search_cj_products(self, query: str) -> list[SupplierProductRead]:
        if not query.strip():
            return []
        try:
            products = self.provider.search_products(query)
        except CJDropshippingError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        return [self._map_supplier_product(item) for item in products[:20]]

    def import_cj_product(self, payload: SupplierProductImportRequest) -> Product:
        if self.repo.db.scalar(select(Product).where(Product.supplier_product_id == payload.supplier_product_id, Product.deleted_at.is_(None))):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CJ product is already imported")
        supplier = self._get_or_create_cj_supplier()
        slug = self._unique_slug(payload.name)
        sale_price = self._sale_price(payload.cost_price or payload.sale_price)
        product = Product(
            supplier_id=supplier.id,
            category_id=uuid.UUID(payload.category_id) if payload.category_id else None,
            name=payload.name,
            slug=slug,
            short_description=payload.description[:500] if payload.description else None,
            description=payload.description,
            sku=self._unique_sku(payload.sku.upper(), Product),
            supplier_sku=payload.supplier_sku or payload.sku,
            supplier_product_id=payload.supplier_product_id,
            cost_price=payload.cost_price,
            sale_price=sale_price,
            currency="USD",
            status="active",
            featured=False,
            is_new=True,
            is_bestseller=False,
        )
        self.repo.db.add(product)
        self.repo.db.flush()
        self.repo.db.add(
            ProductVariant(
                product_id=product.id,
                sku=self._unique_sku(f"{payload.sku.upper()}-CJ", ProductVariant),
                supplier_variant_id=payload.supplier_variant_id,
                price=sale_price,
                cost=payload.cost_price,
                stock=payload.stock,
                image_url=payload.image_url,
                status="active",
            )
        )
        if payload.image_url:
            self.repo.db.add(ProductImage(product_id=product.id, url=payload.image_url, alt_text=payload.name, is_primary=True))
        self.repo.db.commit()
        self.repo.db.refresh(product)
        return product

    def get_copyable_payload(self, order_number: str) -> SupplierOrderPayloadRead:
        order = self._get_order(order_number)
        address = order.addresses[0] if order.addresses else None
        items = [
            SupplierOrderItemRead(
                product_name=item.product_name,
                variant_sku=item.variant_sku,
                supplier_sku=item.supplier_sku,
                supplier_variant_id=item.supplier_variant_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in order.items
        ]
        copyable_payload = {
            "orderNumber": order.order_number,
            "customer": {
                "email": order.customer_email,
                "firstName": order.customer_first_name,
                "lastName": order.customer_last_name,
                "phone": order.customer_phone,
            },
            "shippingAddress": self._address_dict(address),
            "items": [
                {
                    "productName": item.product_name,
                    "variantSku": item.variant_sku,
                    "supplierSku": item.supplier_sku,
                    "supplierVariantId": item.supplier_variant_id,
                    "quantity": item.quantity,
                }
                for item in order.items
            ],
            "shippingMethod": order.shipping_method_code,
            "shippingMethodName": order.shipping_method_name,
            "notes": order.notes,
        }
        if settings.supplier_provider.lower() == "cj" and not order.supplier_order_id:
            try:
                provider_result = self.provider.create_supplier_order(copyable_payload)
            except CJDropshippingError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
            order.supplier_payload = provider_result["copyable_payload"]
            if provider_result.get("supplier_order_id"):
                order.supplier_order_id = provider_result["supplier_order_id"]
                order.supplier_status = provider_result.get("supplier_status", "supplier_confirmed")
                order.fulfillment_status = "supplier_confirmed"
                self.repo.add_history(order, order.supplier_status, "Supplier order submitted through CJ API")
            self.repo.commit()
        elif not order.supplier_payload:
            order.supplier_payload = copyable_payload
            self.repo.commit()
        return SupplierOrderPayloadRead(
            order_number=order.order_number,
            customer_email=order.customer_email,
            shipping_address=self._address_dict(address),
            items=items,
            supplier_status=order.supplier_status,
            supplier_order_id=order.supplier_order_id,
            supplier_real_cost=order.supplier_real_cost,
            copyable_payload=copyable_payload,
        )

    def mark_submitted(self, order_number: str, payload: SupplierSubmissionUpdate) -> Order:
        order = self._get_order(order_number)
        order.supplier_order_id = payload.supplier_order_id
        order.supplier_real_cost = payload.supplier_real_cost or Decimal("0")
        order.supplier_status = "supplier_confirmed"
        order.fulfillment_status = "supplier_confirmed"
        self.repo.add_history(order, "supplier_confirmed", payload.note or "Manual supplier order registered")
        self.repo.commit()
        return order

    def sync_supplier_order(self, order_number: str) -> Order:
        order = self._get_order(order_number)
        if not order.supplier_order_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order does not have a CJ supplier order ID yet")
        try:
            supplier_result = self.provider.get_supplier_order(order.supplier_order_id)
        except CJDropshippingError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

        supplier_order = supplier_result.get("order", {})
        supplier_status = self._normalize_order_status(str(supplier_order.get("supplier_status") or order.supplier_status))
        order.supplier_payload = {**(order.supplier_payload or {}), "lastSupplierSync": supplier_result.get("raw")}
        order.supplier_status = supplier_status
        order.fulfillment_status = supplier_status if supplier_status in {"shipped", "in_transit", "delivered"} else order.fulfillment_status
        if supplier_status in {"shipped", "in_transit", "delivered"}:
            order.status = supplier_status

        if supplier_order.get("min_days"):
            order.shipping_min_days = supplier_order["min_days"]
        if supplier_order.get("max_days"):
            order.shipping_max_days = supplier_order["max_days"]

        tracking_number = supplier_order.get("tracking_number")
        if tracking_number:
            shipment = self.repo.get_or_create_shipment(order)
            shipment.tracking_number = tracking_number
            shipment.carrier = supplier_order.get("carrier") or order.shipping_method_name
            shipment.supplier_order_id = order.supplier_order_id
            shipment.status = supplier_status
            events = supplier_order.get("events") or []
            if not events:
                events = self._tracking_events(tracking_number)
            if not events:
                events = [{"status": supplier_status, "location": None, "description": "Tracking number received from CJ."}]
            for event in events[-10:]:
                self.repo.add_tracking_event(
                    shipment,
                    self._normalize_order_status(str(event.get("status") or supplier_status)),
                    event.get("location"),
                    str(event.get("description") or "CJ tracking update."),
                )
        self.repo.add_history(order, supplier_status, "Supplier order synchronized from CJ")
        self.repo.commit()
        return order

    def add_tracking(self, order_number: str, payload: SupplierTrackingUpdate) -> Order:
        order = self._get_order(order_number)
        shipment = self.repo.get_or_create_shipment(order)
        shipment.tracking_number = payload.tracking_number
        shipment.carrier = payload.carrier
        shipment.supplier_order_id = order.supplier_order_id
        shipment.status = payload.status
        order.status = payload.status
        order.fulfillment_status = payload.status
        order.supplier_status = "shipped" if payload.status in {"shipped", "in_transit"} else order.supplier_status
        self.repo.add_tracking_event(shipment, payload.status, payload.location, payload.description)
        self.repo.add_history(order, payload.status, f"Tracking added: {payload.tracking_number}")
        self.repo.commit()
        return order

    def _get_order(self, order_number: str) -> Order:
        order = self.repo.get_order(order_number)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order

    def _address_dict(self, address) -> dict | None:
        if not address:
            return None
        return {
            "firstName": address.first_name,
            "lastName": address.last_name,
            "phone": address.phone,
            "country": address.country,
            "state": address.state,
            "city": address.city,
            "addressLine1": address.address_line1,
            "addressLine2": address.address_line2,
            "district": address.district,
            "postalCode": address.postal_code,
        }

    def _get_or_create_cj_supplier(self) -> Supplier:
        supplier = self.repo.db.scalar(select(Supplier).where(Supplier.code == "cj"))
        if supplier:
            return supplier
        supplier = Supplier(name="CJ Dropshipping", code="cj", notes="Automated CJ Dropshipping API supplier")
        self.repo.db.add(supplier)
        self.repo.db.flush()
        return supplier

    def _unique_slug(self, name: str) -> str:
        base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "cj-product"
        slug = base[:200]
        index = 2
        while self.repo.db.scalar(select(Product).where(Product.slug == slug)):
            suffix = f"-{index}"
            slug = f"{base[: 220 - len(suffix)]}{suffix}"
            index += 1
        return slug

    def _unique_sku(self, value: str, model: type[Product] | type[ProductVariant]) -> str:
        base = re.sub(r"[^A-Z0-9-]+", "-", value.upper()).strip("-") or "CJ-SKU"
        sku = base[:100]
        index = 2
        while self.repo.db.scalar(select(model).where(model.sku == sku)):
            suffix = f"-{index}"
            sku = f"{base[: 120 - len(suffix)]}{suffix}"
            index += 1
        return sku

    def _map_supplier_product(self, item: dict[str, Any]) -> SupplierProductRead:
        supplier_product_id = str(self._pick(item, "pid", "productId", "id", "supplierProductId") or "")
        name = str(self._pick(item, "productName", "name", "title", "productTitle") or "CJ Product")
        image_url = self._first_image(self._pick(item, "productImage", "productImageSet", "image", "imageUrl", "productImages"))
        variants_raw = self._pick(item, "variants", "variantList", "variantsList", "productVariantList") or []
        variants = [self._map_supplier_variant(variant, name, image_url) for variant in variants_raw if isinstance(variant, dict)]
        if not variants:
            supplier_variant_id = str(self._pick(item, "vid", "variantId", "id") or supplier_product_id)
            variants = [
                SupplierProductVariantRead(
                    supplier_variant_id=supplier_variant_id,
                    sku=str(self._pick(item, "productSku", "sku", "productNum") or f"CJ-{supplier_product_id}"),
                    name=name,
                    price=self._decimal(self._pick(item, "sellPrice", "price", "productPrice", "listedPrice"), Decimal("0")),
                    cost=self._decimal(self._pick(item, "sellPrice", "price", "productPrice", "listedPrice"), Decimal("0")),
                    stock=int(self._decimal(self._pick(item, "stock", "inventory", "sellableQuantity"), Decimal("999"))),
                    image_url=image_url,
                )
            ]
        return SupplierProductRead(
            supplier_product_id=supplier_product_id,
            name=name,
            sku=str(self._pick(item, "productSku", "sku", "productNum") or f"CJ-{supplier_product_id}"),
            description=self._pick(item, "description", "productDescription"),
            image_url=image_url,
            variants=variants,
            raw=item,
        )

    def _map_supplier_variant(self, item: dict[str, Any], fallback_name: str, fallback_image: str | None) -> SupplierProductVariantRead:
        price = self._decimal(self._pick(item, "sellPrice", "price", "variantSellPrice", "listedPrice"), Decimal("0"))
        return SupplierProductVariantRead(
            supplier_variant_id=str(self._pick(item, "vid", "variantId", "id", "supplierVariantId") or ""),
            sku=str(self._pick(item, "variantSku", "sku", "variantKey", "variantNameEn") or "CJ-VARIANT"),
            name=self._pick(item, "variantName", "variantNameEn", "name") or fallback_name,
            price=price,
            cost=self._decimal(self._pick(item, "costPrice", "variantStandard", "standard", "price"), price),
            stock=int(self._decimal(self._pick(item, "stock", "inventory", "sellableQuantity"), Decimal("999"))),
            image_url=self._first_image(self._pick(item, "variantImage", "image", "imageUrl")) or fallback_image,
        )

    def _pick(self, data: dict[str, Any], *keys: str) -> Any:
        for key in keys:
            if key in data and data[key] not in {None, ""}:
                return data[key]
        return None

    def _first_image(self, value: Any) -> str | None:
        if isinstance(value, str):
            return value.split(",")[0].strip()
        if isinstance(value, list) and value:
            first = value[0]
            if isinstance(first, str):
                return first
            if isinstance(first, dict):
                return self._pick(first, "url", "image", "imageUrl")
        return None

    def _decimal(self, value: Any, fallback: Decimal) -> Decimal:
        try:
            if value is None or value == "":
                return fallback
            return Decimal(str(value).replace("$", "").strip())
        except Exception:
            return fallback

    def _sale_price(self, cost: Decimal) -> Decimal:
        value = (cost * Decimal(str(settings.cj_price_markup_multiplier))) + Decimal(str(settings.cj_price_markup_fixed))
        return value.quantize(Decimal("0.01"))

    def _tracking_events(self, tracking_number: str) -> list[dict[str, Any]]:
        try:
            result = self.provider.get_tracking(tracking_number)
        except CJDropshippingError:
            return []
        tracking = result.get("tracking", {})
        return tracking.get("events") or []

    def _normalize_order_status(self, value: str) -> str:
        cleaned = value.lower().replace(" ", "_").replace("-", "_")
        if cleaned in {"delivered", "completed", "signed", "received"}:
            return "delivered"
        if cleaned in {"in_transit", "transit", "shipping", "shipped", "dispatched", "sent"}:
            return "in_transit"
        if cleaned in {"processing", "confirmed", "paid", "supplier_confirmed", "purchased"}:
            return "supplier_confirmed"
        if cleaned in {"cancelled", "canceled", "refunded", "closed"}:
            return "cancelled"
        return cleaned[:40] or "supplier_confirmed"

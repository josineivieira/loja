import re
import uuid
from html import unescape
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
from app.models.product import Product, ProductImage, ProductOption, ProductOptionValue, ProductVariant, VariantOptionValue
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
    SupplierVariantShippingEstimateRead,
    SupplierVariantShippingEstimateRequest,
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
        mapped = [self._map_supplier_product(item) for item in products[:20]]
        needle = query.strip().upper()
        if needle:
            mapped.sort(key=lambda item: 0 if needle in f"{item.sku} {item.supplier_product_id} {' '.join(variant.sku for variant in item.variants)}".upper() else 1)
        return mapped

    def preview_cj_product(self, supplier_product_id: str) -> SupplierProductRead:
        detail = self._cj_product_detail(supplier_product_id)
        if not detail:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="CJ product detail was not found")
        return self._map_supplier_product(detail)

    def estimate_cj_shipping(self, payload: SupplierVariantShippingEstimateRequest) -> list[SupplierVariantShippingEstimateRead]:
        try:
            result = self.provider.calculate_shipping(
                {
                    "startCountryCode": settings.cj_default_from_country,
                    "endCountryCode": payload.country.upper(),
                    "shippingZip": payload.postal_code,
                    "shippingCountryCode": payload.country.upper(),
                    "shippingProvince": payload.state,
                    "shippingCity": payload.city,
                    "products": [{"vid": payload.supplier_variant_id, "quantity": payload.quantity}],
                }
            )
        except CJDropshippingError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        estimates: list[SupplierVariantShippingEstimateRead] = []
        for item in result.get("quotes", []):
            estimates.append(
                SupplierVariantShippingEstimateRead(
                    code=item["code"],
                    name=f"CJ {item['name']}",
                    amount=item["amount"],
                    currency=item["currency"],
                    min_days=item["min_days"],
                    max_days=item["max_days"],
                    tracking_available=item["tracking_available"],
                )
            )
        if not estimates:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CJ did not return shipping options for this destination")
        return estimates

    def import_cj_product(self, payload: SupplierProductImportRequest) -> Product:
        if self.repo.db.scalar(select(Product).where(Product.supplier_product_id == payload.supplier_product_id, Product.deleted_at.is_(None))):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="CJ product is already imported")
        detail = self._cj_product_detail(payload.supplier_product_id)
        supplier = self._get_or_create_cj_supplier()
        name = self._clean_title(payload.name or str(self._pick(detail, "productName", "name", "title", "productTitle") or "CJ Product"))
        description = self._clean_description(str(payload.description or self._pick(detail, "description", "productDescription", "descriptionEn", "productDescriptionEn") or ""))
        short_description = self._summary(description, name)
        images = list(dict.fromkeys([*(payload.images or []), *self._images(detail, payload.image_url)]))
        variants = self._import_variants(payload) or self._detail_variants(detail, payload)
        if not variants:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select at least one CJ variant with a valid variant ID")
        slug = self._unique_slug(name)
        first_variant = variants[0]
        sale_price = first_variant.price
        product = Product(
            supplier_id=supplier.id,
            category_id=uuid.UUID(payload.category_id) if payload.category_id else None,
            name=name,
            slug=slug,
            short_description=short_description,
            description=description,
            sku=self._unique_sku(payload.sku.upper(), Product),
            supplier_sku=payload.supplier_sku or payload.sku,
            supplier_product_id=payload.supplier_product_id,
            cost_price=first_variant.cost,
            sale_price=sale_price,
            currency="USD",
            status="active",
            featured=False,
            is_new=True,
            is_bestseller=False,
        )
        self.repo.db.add(product)
        self.repo.db.flush()
        option_cache: dict[tuple[str, str], ProductOptionValue] = {}
        for index, variant_data in enumerate(variants):
            variant = ProductVariant(
                product_id=product.id,
                sku=self._unique_sku(f"{variant_data.sku.upper()}-CJ", ProductVariant),
                supplier_variant_id=variant_data.supplier_variant_id,
                price=variant_data.price,
                cost=variant_data.cost,
                stock=variant_data.stock,
                image_url=variant_data.image_url or payload.image_url,
                status="active",
            )
            self.repo.db.add(variant)
            self.repo.db.flush()
            self._attach_variant_options(product, variant, variant_data.options or {"Option": variant_data.name or variant_data.sku}, description, index, option_cache)
            if index == 0:
                product.sale_price = variant_data.price
                product.cost_price = variant_data.cost
        for index, image_url in enumerate(images[:8]):
            self.repo.db.add(ProductImage(product_id=product.id, url=image_url, alt_text=name, sort_order=index, is_primary=index == 0))
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
        supplier_product_id = str(self._pick(item, "pid", "productId", "id", "supplierProductId", "productSku", "spu", "productCode", "productNo") or "")
        name = self._clean_title(str(self._pick(item, "productName", "name", "title", "productTitle") or "CJ Product"))
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
                    options=self._variant_options_from_raw(item, name),
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
            description=self._clean_description(str(self._pick(item, "description", "productDescription") or "")),
            image_url=image_url,
            images=self._images(item, image_url),
            variants=variants,
            raw=item,
        )

    def _import_variants(self, payload: SupplierProductImportRequest) -> list[SupplierProductVariantRead]:
        selected = [variant for variant in payload.variants if variant.selected]
        return [
            SupplierProductVariantRead(
                supplier_variant_id=variant.supplier_variant_id,
                sku=variant.sku,
                name=variant.name,
                options=variant.options,
                price=variant.sale_price,
                cost=variant.cost_price,
                stock=variant.stock,
                image_url=variant.image_url,
            )
            for variant in selected
            if variant.supplier_variant_id
        ]

    def _cj_product_detail(self, supplier_product_id: str) -> dict[str, Any]:
        try:
            detail = self.provider.get_product(supplier_product_id)
        except CJDropshippingError:
            return {}
        return detail if isinstance(detail, dict) else {}

    def _detail_variants(self, detail: dict[str, Any], payload: SupplierProductImportRequest) -> list[SupplierProductVariantRead]:
        variants_raw = self._pick(detail, "variants", "variantList", "variantsList", "productVariantList") or []
        variants = [self._map_supplier_variant(variant, payload.name, payload.image_url) for variant in variants_raw if isinstance(variant, dict)]
        variants = [variant for variant in variants if variant.supplier_variant_id]
        if variants:
            return [
                SupplierProductVariantRead(
                    supplier_variant_id=variant.supplier_variant_id,
                    sku=variant.sku,
                    name=variant.name,
                    options=variant.options,
                    price=self._sale_price(variant.cost or variant.price),
                    cost=variant.cost,
                    stock=variant.stock,
                    image_url=variant.image_url,
                )
                for variant in variants[:20]
            ]
        return [
            SupplierProductVariantRead(
                supplier_variant_id=payload.supplier_variant_id,
                sku=payload.supplier_sku or payload.sku,
                name=payload.name,
                options={},
                price=payload.sale_price,
                cost=payload.cost_price,
                stock=payload.stock,
                image_url=payload.image_url,
            )
        ]

    def _images(self, detail: dict[str, Any], fallback: str | None) -> list[str]:
        values = self._pick(detail, "productImageSet", "productImages", "images", "imageList", "productImage")
        images: list[str] = []
        if isinstance(values, str):
            images.extend([item.strip() for item in values.split(",") if item.strip()])
        elif isinstance(values, list):
            for item in values:
                if isinstance(item, str):
                    images.append(item)
                elif isinstance(item, dict):
                    image = self._pick(item, "url", "image", "imageUrl")
                    if image:
                        images.append(str(image))
        if fallback:
            images.insert(0, fallback)
        return list(dict.fromkeys(images))

    def _clean_description(self, value: str) -> str:
        cleaned = unescape(value)
        cleaned = re.sub(r"<[^>]+>", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned[:5000]

    def _clean_title(self, value: str) -> str:
        cleaned = unescape(value).strip()
        quoted = re.findall(r'"([^"]{3,})"', cleaned)
        if quoted:
            cleaned = quoted[0]
        cleaned = cleaned.strip("[]'\" ")
        cleaned = re.sub(r"\s+", " ", cleaned)
        return cleaned[:180] or "CJ Product"

    def _summary(self, description: str, fallback: str) -> str:
        if description:
            return description[:500]
        return f"{fallback} imported from CJ with supplier variant data ready for checkout and fulfillment."

    def _map_supplier_variant(self, item: dict[str, Any], fallback_name: str, fallback_image: str | None) -> SupplierProductVariantRead:
        price = self._decimal(self._pick(item, "sellPrice", "price", "variantSellPrice", "listedPrice"), Decimal("0"))
        return SupplierProductVariantRead(
            supplier_variant_id=str(self._pick(item, "vid", "variantId", "id", "supplierVariantId") or ""),
            sku=str(self._pick(item, "variantSku", "sku", "variantKey", "variantNameEn") or "CJ-VARIANT"),
            name=self._pick(item, "variantName", "variantNameEn", "variantKey", "name") or fallback_name,
            options=self._variant_options_from_raw(item, fallback_name),
            price=price,
            cost=self._decimal(self._pick(item, "costPrice", "variantStandard", "standard", "price"), price),
            stock=int(self._decimal(self._pick(item, "stock", "inventory", "sellableQuantity"), Decimal("999"))),
            image_url=self._first_image(self._pick(item, "variantImage", "image", "imageUrl")) or fallback_image,
        )

    def _attach_variant_options(
        self,
        product: Product,
        variant: ProductVariant,
        raw_name: str,
        product_description: str,
        index: int,
        option_cache: dict[tuple[str, str], ProductOptionValue],
    ) -> None:
        raw_options: dict[str, str] = {}
        if isinstance(raw_name, dict):
            raw_options = raw_name
            raw_name = " ".join(raw_options.values())
        parsed = raw_options or self._parse_variant_options(str(raw_name), product_description, index)
        for option_name, label in parsed.items():
            normalized_option = self._normalize_option_name(option_name)
            key = (normalized_option, label.lower())
            option_value = option_cache.get(key)
            if not option_value:
                option = next((item for item in product.options if item.name == normalized_option), None)
                if not option:
                    option = ProductOption(
                        product_id=product.id,
                        name=normalized_option,
                        display_name=self._option_display_name(normalized_option),
                        sort_order={"color": 0, "size": 1, "capacity": 2, "style": 3}.get(normalized_option, 9),
                    )
                    self.repo.db.add(option)
                    self.repo.db.flush()
                    product.options.append(option)
                option_value = ProductOptionValue(option_id=option.id, value=label.lower(), label=label, sort_order=len(option.values))
                self.repo.db.add(option_value)
                self.repo.db.flush()
                option.values.append(option_value)
                option_cache[key] = option_value
            self.repo.db.add(VariantOptionValue(variant_id=variant.id, option_value_id=option_value.id))

    def _normalize_option_name(self, value: str) -> str:
        cleaned = value.strip().lower()
        if cleaned in {"cor", "colour"}:
            return "color"
        if cleaned in {"tamanho", "talla"}:
            return "size"
        if cleaned in {"capacidade"}:
            return "capacity"
        if cleaned in {"estilo"}:
            return "style"
        return cleaned or "option"

    def _option_display_name(self, value: str) -> str:
        return {
            "color": "Cor",
            "size": "Tamanho",
            "capacity": "Capacidade",
            "style": "Estilo",
            "option": "Opcao",
        }.get(value, value.title())

    def _parse_variant_options(self, raw_name: str, product_description: str, index: int) -> dict[str, str]:
        value = unescape(raw_name or "")
        tokens = [item.strip() for item in re.split(r"[,/|;:_-]+", value) if item.strip()]
        colors = {
            "white": "Branco",
            "beige": "Bege",
            "black": "Preto",
            "blue": "Azul",
            "green": "Verde",
            "pink": "Rosa",
            "red": "Vermelho",
            "orange": "Laranja",
            "yellow": "Amarelo",
            "purple": "Roxo",
            "gray": "Cinza",
            "grey": "Cinza",
            "wine": "Vinho",
            "khaki": "Caqui",
            "brown": "Marrom",
        }
        sizes = {"xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl", "2xl", "3xl", "4xl", "5xl"}
        parsed: dict[str, str] = {}
        for token in tokens:
            normalized = token.lower().strip()
            if normalized in colors:
                parsed["color"] = colors[normalized]
            elif normalized in sizes or re.fullmatch(r"\d{2,3}", normalized):
                parsed["size"] = token.upper()
        if "size" not in parsed:
            size_match = re.search(r"size(?:\s*information)?\s*:?\s*([XSML0-9,\s/-]{1,40})", product_description, flags=re.IGNORECASE)
            if size_match:
                available_sizes = [
                    item.strip().upper()
                    for item in re.split(r"[,/\s]+", size_match.group(1))
                    if re.fullmatch(r"XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL|\d{2,3}", item.strip().upper())
                ]
                alpha_sizes = [item for item in available_sizes if re.search(r"[A-Z]", item)]
                if alpha_sizes:
                    available_sizes = alpha_sizes
                if available_sizes:
                    parsed["size"] = available_sizes[index % len(available_sizes)]
        if not parsed and tokens and not raw_name.upper().startswith("CJ"):
            parsed["option"] = tokens[-1][:40]
        if not parsed:
            parsed["option"] = f"Opcao {index + 1}"
        return parsed

    def _variant_options_from_raw(self, item: dict[str, Any], fallback_name: str) -> dict[str, str]:
        options: dict[str, str] = {}
        direct_fields = {
            "Color": self._pick(item, "color", "colour", "Color", "variantColor"),
            "Size": self._pick(item, "size", "Size", "variantSize"),
            "Capacity": self._pick(item, "capacity", "Capacity", "capacidade"),
            "Style": self._pick(item, "style", "Style", "variantStyle"),
        }
        for key, value in direct_fields.items():
            if value:
                options[key] = str(value).strip()
        candidates = [
            self._pick(item, "variantNameEn", "variantName", "variantKey", "name"),
            self._pick(item, "variantSku", "sku"),
            fallback_name,
        ]
        text = " / ".join(str(value) for value in candidates if value)
        if "Color" not in options:
            color = self._extract_color(text)
            if color:
                options["Color"] = color
        if "Size" not in options:
            size = self._extract_size(text)
            if size:
                options["Size"] = size
        if "Capacity" not in options:
            capacity = self._extract_capacity(text)
            if capacity:
                options["Capacity"] = capacity
        return options

    def _extract_color(self, value: str) -> str | None:
        colors = {
            "white": "White",
            "beige": "Beige",
            "black": "Black",
            "blue": "Blue",
            "green": "Green",
            "pink": "Pink",
            "red": "Red",
            "orange": "Orange",
            "yellow": "Yellow",
            "purple": "Purple",
            "gray": "Gray",
            "grey": "Gray",
            "wine": "Wine",
            "khaki": "Khaki",
            "brown": "Brown",
        }
        lowered = value.lower()
        for key, label in colors.items():
            if re.search(rf"\b{re.escape(key)}\b", lowered):
                return label
        return None

    def _extract_size(self, value: str) -> str | None:
        match = re.search(r"\b(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL)\b", value, flags=re.IGNORECASE)
        return match.group(1).upper() if match else None

    def _extract_capacity(self, value: str) -> str | None:
        match = re.search(r"\b(\d{2,5}\s*(?:mah|ml|l|gb|tb|w))\b", value, flags=re.IGNORECASE)
        return re.sub(r"\s+", "", match.group(1)).lower() if match else None

    def _pick(self, data: dict[str, Any], *keys: str) -> Any:
        for key in keys:
            if key in data and data[key] is not None and data[key] != "":
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

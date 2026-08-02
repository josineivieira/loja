import secrets
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.integrations.cj_dropshipping.cj_provider import CJDropshippingProvider
from app.integrations.cj_dropshipping.exceptions import CJDropshippingError
from app.models.order import Order, OrderAddress, OrderItem, OrderStatusHistory
from app.repositories.checkout import CheckoutRepository
from app.schemas.checkout import (
    CheckoutCalculateRequest,
    CheckoutCalculationResponse,
    CheckoutCreateOrderRequest,
    CheckoutLine,
    CheckoutTotals,
    ShippingQuote,
)


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class CheckoutService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CheckoutRepository(db)
        self.cj = CJDropshippingProvider() if settings.supplier_provider.lower() == "cj" else None

    def calculate(self, payload: CheckoutCalculateRequest) -> CheckoutCalculationResponse:
        variant_ids = [item.variant_id for item in payload.items]
        variants = {variant.id: variant for variant in self.repo.get_variants(variant_ids)}
        lines: list[CheckoutLine] = []

        for item in payload.items:
            variant = variants.get(item.variant_id)
            if not variant or not variant.product or variant.product.deleted_at or variant.product.status != "active":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unavailable product in cart")
            if variant.stock < item.quantity:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Insufficient stock for {variant.sku}")
            unit_price = money(variant.price)
            lines.append(
                CheckoutLine(
                    product_id=variant.product_id,
                    variant_id=variant.id,
                    supplier_sku=variant.product.supplier_sku,
                    supplier_variant_id=variant.supplier_variant_id,
                    product_name=variant.product.name,
                    variant_sku=variant.sku,
                    quantity=item.quantity,
                    unit_price=unit_price,
                    total_price=money(unit_price * item.quantity),
                    currency=variant.product.currency,
                )
            )

        currency = lines[0].currency if lines else payload.currency.upper()
        subtotal = money(sum((line.total_price for line in lines), Decimal("0")))
        discount = self._calculate_discount(payload.coupon_code, subtotal)
        country = payload.address.country.upper() if payload.address else None
        shipping_methods = self._shipping_quotes(country, subtotal, currency, payload, lines)
        selected_shipping = self._select_shipping(payload.shipping_method_code, shipping_methods)
        tax = Decimal("0.00")
        total = money(subtotal - discount + selected_shipping.amount + tax)

        return CheckoutCalculationResponse(
            items=lines,
            shipping_methods=shipping_methods,
            totals=CheckoutTotals(
                subtotal_amount=subtotal,
                discount_amount=discount,
                shipping_amount=selected_shipping.amount,
                tax_amount=tax,
                total_amount=total,
                currency=currency,
                coupon_code=payload.coupon_code.upper() if payload.coupon_code else None,
                shipping_method_code=selected_shipping.code,
            ),
        )

    def create_order(self, payload: CheckoutCreateOrderRequest, customer_id: str | None = None) -> Order:
        calculation = self.calculate(payload)
        selected_shipping = self._select_shipping(calculation.totals.shipping_method_code, calculation.shipping_methods)
        order_number = self._make_order_number()
        address = payload.address
        order = Order(
            order_number=order_number,
            customer_id=customer_id,
            customer_email=str(address.email).lower(),
            customer_first_name=address.first_name,
            customer_last_name=address.last_name,
            customer_phone=address.phone,
            subtotal_amount=calculation.totals.subtotal_amount,
            discount_amount=calculation.totals.discount_amount,
            shipping_amount=calculation.totals.shipping_amount,
            tax_amount=calculation.totals.tax_amount,
            total_amount=calculation.totals.total_amount,
            currency=calculation.totals.currency,
            original_currency="USD",
            charged_currency=calculation.totals.currency,
            exchange_rate=Decimal("1"),
            coupon_code=calculation.totals.coupon_code,
            shipping_method_code=calculation.totals.shipping_method_code,
            shipping_method_name=selected_shipping.name,
            shipping_min_days=selected_shipping.min_days,
            shipping_max_days=selected_shipping.max_days,
            shipping_tracking_available=selected_shipping.tracking_available,
            notes=address.notes,
        )
        order.items = [
            OrderItem(
                product_id=line.product_id,
                variant_id=line.variant_id,
                product_name=line.product_name,
                variant_sku=line.variant_sku,
                supplier_sku=line.supplier_sku,
                supplier_variant_id=line.supplier_variant_id,
                quantity=line.quantity,
                unit_price=line.unit_price,
                total_price=line.total_price,
                currency=line.currency,
            )
            for line in calculation.items
        ]
        order.addresses = [
            OrderAddress(
                address_type="shipping",
                first_name=address.first_name,
                last_name=address.last_name,
                phone=address.phone,
                country=address.country.upper(),
                state=address.state,
                city=address.city,
                address_line1=address.address_line1,
                address_line2=address.address_line2,
                district=address.district,
                postal_code=address.postal_code,
            )
        ]
        order.history = [OrderStatusHistory(from_status=None, to_status="awaiting_payment", note="Order created from checkout")]
        return self.repo.create_order(order)

    def get_order(self, order_number: str) -> Order:
        order = self.repo.get_order_by_number(order_number)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order

    def list_customer_orders(self, customer_id: str) -> list[Order]:
        return self.repo.list_orders_for_customer(customer_id)

    def _calculate_discount(self, coupon_code: str | None, subtotal: Decimal) -> Decimal:
        if not coupon_code:
            return Decimal("0.00")
        coupon = self.repo.get_coupon(coupon_code)
        if not coupon:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid coupon")
        if subtotal < coupon.minimum_amount:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Coupon minimum amount not reached")
        if coupon.discount_type == "percent":
            return money(subtotal * (coupon.value / Decimal("100")))
        if coupon.discount_type == "fixed":
            return money(min(coupon.value, subtotal))
        if coupon.discount_type == "free_shipping":
            return Decimal("0.00")
        return Decimal("0.00")

    def _shipping_quotes(self, country: str | None, subtotal: Decimal, currency: str, payload: CheckoutCalculateRequest, lines: list[CheckoutLine]) -> list[ShippingQuote]:
        cj_quotes = self._cj_shipping_quotes(payload, lines, currency)
        if cj_quotes:
            return cj_quotes
        if settings.supplier_provider.lower() == "cj":
            if not payload.address:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enter the delivery address to calculate shipping.")
            if not all(line.supplier_variant_id for line in lines):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This product needs to be updated before checkout.")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Delivery is not available for this address and cart.")
        quotes: list[ShippingQuote] = []
        for method in self.repo.list_shipping_methods(country):
            amount = Decimal("0.00") if method.free_over_amount and subtotal >= method.free_over_amount else method.amount
            quotes.append(
                ShippingQuote(
                    code=method.code,
                    name=method.name,
                    amount=money(amount),
                    currency=currency,
                    min_days=method.min_days,
                    max_days=method.max_days,
                    tracking_available=method.tracking_available,
                )
            )
        if not quotes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Shipping is not available for this destination")
        return quotes

    def _cj_shipping_quotes(self, payload: CheckoutCalculateRequest, lines: list[CheckoutLine], currency: str) -> list[ShippingQuote]:
        if not self.cj or not payload.address or not all(line.supplier_variant_id for line in lines):
            return []
        try:
            request_payload = {
                "startCountryCode": settings.cj_default_from_country,
                "endCountryCode": payload.address.country.upper(),
                "shippingZip": payload.address.postal_code,
                "shippingCountryCode": payload.address.country.upper(),
                "shippingProvince": payload.address.state,
                "shippingCity": payload.address.city,
                "products": [
                    {"vid": str(line.supplier_variant_id), "quantity": line.quantity}
                    for line in lines
                    if line.supplier_variant_id
                ],
            }
            result = self.cj.calculate_shipping(request_payload)
        except CJDropshippingError:
            return []
        quotes = []
        for item in result.get("quotes", []):
            amount = money((Decimal(str(item["amount"])) * Decimal(str(settings.cj_shipping_markup_multiplier))) + Decimal(str(settings.cj_shipping_markup_fixed)))
            quotes.append(
                ShippingQuote(
                    code=item["code"],
                    name=f"CJ {item['name']}",
                    amount=amount,
                    currency=currency,
                    min_days=item["min_days"],
                    max_days=item["max_days"],
                    tracking_available=item["tracking_available"],
                )
            )
        return quotes

    def _select_shipping(self, code: str | None, quotes: list[ShippingQuote]) -> ShippingQuote:
        if code:
            for quote in quotes:
                if quote.code == code:
                    return quote
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid shipping method")
        return quotes[0]

    def _make_order_number(self) -> str:
        return f"NX{secrets.randbelow(90000000) + 10000000}"

from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.integrations.cj_dropshipping.manual_provider import ManualSupplierProvider
from app.models.order import Order
from app.repositories.supplier import SupplierRepository
from app.schemas.supplier import SupplierOrderItemRead, SupplierOrderPayloadRead, SupplierSubmissionUpdate, SupplierTrackingUpdate


class SupplierService:
    def __init__(self, db: Session):
        self.repo = SupplierRepository(db)
        self.provider = ManualSupplierProvider()

    def list_pending(self) -> list[Order]:
        return self.repo.list_pending_orders()

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
            "notes": order.notes,
        }
        provider_result = self.provider.create_supplier_order(copyable_payload)
        order.supplier_payload = provider_result["copyable_payload"]
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


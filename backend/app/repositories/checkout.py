import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Coupon, Order, ShippingMethod
from app.models.product import ProductVariant


class CheckoutRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_variants(self, variant_ids: list[uuid.UUID]) -> list[ProductVariant]:
        statement = (
            select(ProductVariant)
            .options(selectinload(ProductVariant.product))
            .where(ProductVariant.id.in_(variant_ids), ProductVariant.status == "active")
        )
        return list(self.db.scalars(statement))

    def list_shipping_methods(self, country: str | None) -> list[ShippingMethod]:
        statement = select(ShippingMethod).where(ShippingMethod.active.is_(True)).order_by(ShippingMethod.amount)
        methods = list(self.db.scalars(statement))
        if not country:
            return methods
        return [method for method in methods if not method.countries or country.upper() in method.countries]

    def get_shipping_method(self, code: str) -> ShippingMethod | None:
        return self.db.scalar(select(ShippingMethod).where(ShippingMethod.code == code, ShippingMethod.active.is_(True)))

    def get_coupon(self, code: str) -> Coupon | None:
        return self.db.scalar(select(Coupon).where(Coupon.code == code.upper(), Coupon.active.is_(True)))

    def get_order_by_number(self, order_number: str) -> Order | None:
        return self.db.scalar(select(Order).options(selectinload(Order.items)).where(Order.order_number == order_number))

    def create_order(self, order: Order) -> Order:
        self.db.add(order)
        self.db.commit()
        self.db.refresh(order)
        return self.get_order_by_number(order.order_number) or order


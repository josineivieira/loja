import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.order import Coupon, ShippingMethod
from app.repositories.admin import AdminRepository
from app.schemas.admin import CouponCreate, CouponUpdate, ShippingMethodCreate, ShippingMethodUpdate


class AdminService:
    def __init__(self, db: Session):
        self.repo = AdminRepository(db)

    def dashboard(self) -> dict:
        return self.repo.dashboard()

    def list_orders(self):
        return self.repo.list_orders()

    def update_order_status(self, order_number: str, status_value: str, note: str | None):
        order = self.repo.update_order_status(order_number, status_value, note)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order

    def list_customers(self):
        return self.repo.list_customers()

    def list_coupons(self):
        return self.repo.list_coupons()

    def create_coupon(self, payload: CouponCreate):
        return self.repo.create_coupon(Coupon(**payload.model_dump(), code=payload.code.upper()))

    def update_coupon(self, coupon_id: uuid.UUID, payload: CouponUpdate):
        coupon = self.repo.get_coupon(coupon_id)
        if not coupon:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(coupon, key, value)
        return self.repo.create_coupon(coupon)

    def list_shipping_methods(self):
        return self.repo.list_shipping_methods()

    def create_shipping_method(self, payload: ShippingMethodCreate):
        data = payload.model_dump()
        data["countries"] = [country.upper() for country in data["countries"]]
        return self.repo.create_shipping_method(ShippingMethod(**data, code=payload.code.lower()))

    def update_shipping_method(self, method_id: uuid.UUID, payload: ShippingMethodUpdate):
        method = self.repo.get_shipping_method(method_id)
        if not method:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipping method not found")
        for key, value in payload.model_dump(exclude_unset=True).items():
            setattr(method, key, [country.upper() for country in value] if key == "countries" and value else value)
        return self.repo.create_shipping_method(method)


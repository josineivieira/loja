import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Coupon, Order, OrderStatusHistory, ShippingMethod
from app.models.product import ProductVariant
from app.models.role import UserRole
from app.models.user import User


class AdminRepository:
    def __init__(self, db: Session):
        self.db = db

    def dashboard(self) -> dict:
        month_start = datetime.now(UTC).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        paid = Order.payment_status == "paid"
        sales_month = self.db.scalar(select(func.coalesce(func.sum(Order.total_amount), 0)).where(paid, Order.created_at >= month_start))
        total_orders = self.db.scalar(select(func.count(Order.id))) or 0
        paid_orders = self.db.scalar(select(func.count(Order.id)).where(Order.payment_status == "paid")) or 0
        return {
            "sales_today": 0,
            "sales_month": sales_month,
            "total_orders": total_orders,
            "pending_orders": self.db.scalar(select(func.count(Order.id)).where(Order.status.in_(["pending", "awaiting_payment"]))) or 0,
            "paid_orders": paid_orders,
            "shipped_orders": self.db.scalar(select(func.count(Order.id)).where(Order.status == "shipped")) or 0,
            "delivered_orders": self.db.scalar(select(func.count(Order.id)).where(Order.status == "delivered")) or 0,
            "cancelled_orders": self.db.scalar(select(func.count(Order.id)).where(Order.status == "cancelled")) or 0,
            "average_order_value": (sales_month / paid_orders) if paid_orders else 0,
            "new_customers": self.db.scalar(select(func.count(User.id)).where(User.created_at >= month_start)) or 0,
            "low_stock": self.db.scalar(select(func.count(ProductVariant.id)).where(ProductVariant.stock <= 5)) or 0,
            "failed_payments": self.db.scalar(select(func.count(Order.id)).where(Order.payment_status == "failed")) or 0,
            "supplier_pending": self.db.scalar(select(func.count(Order.id)).where(Order.supplier_status == "supplier_pending")) or 0,
        }

    def list_orders(self) -> list[Order]:
        return list(self.db.scalars(select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc()).limit(100)))

    def update_order_status(self, order_number: str, status: str, note: str | None) -> Order | None:
        order = self.db.scalar(select(Order).where(Order.order_number == order_number))
        if not order:
            return None
        previous = order.status
        order.status = status
        order.history.append(OrderStatusHistory(from_status=previous, to_status=status, note=note))
        self.db.commit()
        self.db.refresh(order)
        return order

    def list_customers(self) -> list[User]:
        statement = select(User).options(selectinload(User.roles).selectinload(UserRole.role)).where(User.deleted_at.is_(None)).order_by(User.created_at.desc()).limit(100)
        return list(self.db.scalars(statement))

    def list_coupons(self) -> list[Coupon]:
        return list(self.db.scalars(select(Coupon).order_by(Coupon.created_at.desc())))

    def get_coupon(self, coupon_id: uuid.UUID) -> Coupon | None:
        return self.db.get(Coupon, coupon_id)

    def create_coupon(self, coupon: Coupon) -> Coupon:
        self.db.add(coupon)
        self.db.commit()
        self.db.refresh(coupon)
        return coupon

    def list_shipping_methods(self) -> list[ShippingMethod]:
        return list(self.db.scalars(select(ShippingMethod).order_by(ShippingMethod.amount)))

    def get_shipping_method(self, method_id: uuid.UUID) -> ShippingMethod | None:
        return self.db.get(ShippingMethod, method_id)

    def create_shipping_method(self, method: ShippingMethod) -> ShippingMethod:
        self.db.add(method)
        self.db.commit()
        self.db.refresh(method)
        return method


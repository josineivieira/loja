from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.order import Order, OrderStatusHistory, Shipment, TrackingEvent


class SupplierRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_pending_orders(self) -> list[Order]:
        statement = (
            select(Order)
            .options(selectinload(Order.items), selectinload(Order.addresses))
            .where(Order.supplier_status.in_(["supplier_pending", "supplier_confirmed"]))
            .order_by(Order.created_at.desc())
            .limit(100)
        )
        return list(self.db.scalars(statement))

    def get_order(self, order_number: str) -> Order | None:
        statement = select(Order).options(selectinload(Order.items), selectinload(Order.addresses)).where(Order.order_number == order_number)
        return self.db.scalar(statement)

    def get_or_create_shipment(self, order: Order) -> Shipment:
        shipment = self.db.scalar(select(Shipment).options(selectinload(Shipment.events)).where(Shipment.order_id == order.id))
        if shipment:
            return shipment
        shipment = Shipment(order_id=order.id, status="pending")
        self.db.add(shipment)
        self.db.flush()
        return shipment

    def commit(self) -> None:
        self.db.commit()

    def add_history(self, order: Order, to_status: str, note: str | None) -> None:
        order.history.append(OrderStatusHistory(from_status=order.status, to_status=to_status, note=note))

    def add_tracking_event(self, shipment: Shipment, status: str, location: str | None, description: str) -> TrackingEvent:
        event = TrackingEvent(shipment_id=shipment.id, status=status, location=location, description=description)
        self.db.add(event)
        return event


import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.engagement import Notification, Review, Wishlist, WishlistItem
from app.models.order import Order, Shipment


class EngagementRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_wishlist(self, user_id: uuid.UUID) -> Wishlist:
        wishlist = self.db.scalar(select(Wishlist).where(Wishlist.user_id == user_id))
        if wishlist:
            return wishlist
        wishlist = Wishlist(user_id=user_id)
        self.db.add(wishlist)
        self.db.flush()
        return wishlist

    def list_wishlist_items(self, user_id: uuid.UUID) -> list[WishlistItem]:
        wishlist = self.get_or_create_wishlist(user_id)
        return list(self.db.scalars(select(WishlistItem).where(WishlistItem.wishlist_id == wishlist.id).order_by(WishlistItem.created_at.desc())))

    def add_wishlist_item(self, user_id: uuid.UUID, product_id: uuid.UUID) -> WishlistItem:
        wishlist = self.get_or_create_wishlist(user_id)
        item = self.db.scalar(select(WishlistItem).where(WishlistItem.wishlist_id == wishlist.id, WishlistItem.product_id == product_id))
        if item:
            return item
        item = WishlistItem(wishlist_id=wishlist.id, product_id=product_id)
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def remove_wishlist_item(self, user_id: uuid.UUID, product_id: uuid.UUID) -> bool:
        wishlist = self.get_or_create_wishlist(user_id)
        item = self.db.scalar(select(WishlistItem).where(WishlistItem.wishlist_id == wishlist.id, WishlistItem.product_id == product_id))
        if not item:
            return False
        self.db.delete(item)
        self.db.commit()
        return True

    def list_product_reviews(self, product_id: uuid.UUID, approved_only: bool = True) -> list[Review]:
        statement = select(Review).where(Review.product_id == product_id).order_by(Review.created_at.desc())
        if approved_only:
            statement = statement.where(Review.status == "approved")
        return list(self.db.scalars(statement))

    def create_review(self, review: Review) -> Review:
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def list_reviews(self) -> list[Review]:
        return list(self.db.scalars(select(Review).order_by(Review.created_at.desc()).limit(100)))

    def get_review(self, review_id: uuid.UUID) -> Review | None:
        return self.db.get(Review, review_id)

    def get_tracking(self, order_number: str) -> tuple[Order, Shipment | None] | None:
        order = self.db.scalar(select(Order).where(Order.order_number == order_number))
        if not order:
            return None
        shipment = self.db.scalar(select(Shipment).options(selectinload(Shipment.events)).where(Shipment.order_id == order.id))
        return order, shipment

    def list_notifications(self) -> list[Notification]:
        return list(self.db.scalars(select(Notification).order_by(Notification.created_at.desc()).limit(100)))

    def create_notification(self, notification: Notification) -> Notification:
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification


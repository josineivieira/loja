import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.engagement import Notification, Review
from app.repositories.engagement import EngagementRepository
from app.schemas.engagement import ReviewCreate, ReviewModerationUpdate, TrackingRead


class EngagementService:
    def __init__(self, db: Session):
        self.repo = EngagementRepository(db)

    def list_wishlist(self, user_id: uuid.UUID):
        return self.repo.list_wishlist_items(user_id)

    def add_wishlist(self, user_id: uuid.UUID, product_id: uuid.UUID):
        return self.repo.add_wishlist_item(user_id, product_id)

    def remove_wishlist(self, user_id: uuid.UUID, product_id: uuid.UUID):
        if not self.repo.remove_wishlist_item(user_id, product_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wishlist item not found")

    def list_product_reviews(self, product_id: uuid.UUID):
        return self.repo.list_product_reviews(product_id)

    def create_review(self, payload: ReviewCreate, user_id: uuid.UUID | None = None):
        review = self.repo.create_review(Review(**payload.model_dump(), user_id=user_id, status="pending"))
        self.repo.create_notification(Notification(title="New review awaiting moderation", message=payload.comment, type="review_pending"))
        return review

    def list_reviews(self):
        return self.repo.list_reviews()

    def moderate_review(self, review_id: uuid.UUID, payload: ReviewModerationUpdate):
        review = self.repo.get_review(review_id)
        if not review:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
        review.status = payload.status
        review.admin_reply = payload.admin_reply
        return self.repo.create_review(review)

    def get_tracking(self, order_number: str) -> TrackingRead:
        result = self.repo.get_tracking(order_number)
        if not result:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        order, shipment = result
        if not shipment:
            return TrackingRead(order_number=order.order_number, tracking_number=None, carrier=None, status=order.status, events=[])
        return TrackingRead(order_number=order.order_number, tracking_number=shipment.tracking_number, carrier=shipment.carrier, status=shipment.status, events=shipment.events)

    def list_notifications(self):
        return self.repo.list_notifications()


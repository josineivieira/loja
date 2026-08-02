import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user, require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.engagement import (
    NotificationRead,
    ReviewCreate,
    ReviewModerationUpdate,
    ReviewRead,
    TrackingRead,
    WishlistItemCreate,
    WishlistItemRead,
)
from app.services.engagement import EngagementService

router = APIRouter(tags=["Engagement"])


@router.get("/wishlist", response_model=list[WishlistItemRead])
def list_wishlist(current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> list[WishlistItemRead]:
    return EngagementService(db).list_wishlist(current_user.id)


@router.post("/wishlist/items", response_model=WishlistItemRead, status_code=201)
def add_wishlist_item(payload: WishlistItemCreate, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> WishlistItemRead:
    return EngagementService(db).add_wishlist(current_user.id, payload.product_id)


@router.delete("/wishlist/items/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_wishlist_item(product_id: uuid.UUID, current_user: Annotated[User, Depends(get_current_user)], db: Annotated[Session, Depends(get_db)]) -> Response:
    EngagementService(db).remove_wishlist(current_user.id, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/products/{product_id}/reviews", response_model=list[ReviewRead])
def list_product_reviews(product_id: uuid.UUID, db: Annotated[Session, Depends(get_db)]) -> list[ReviewRead]:
    return EngagementService(db).list_product_reviews(product_id)


@router.post("/reviews", response_model=ReviewRead, status_code=201)
def create_review(payload: ReviewCreate, db: Annotated[Session, Depends(get_db)]) -> ReviewRead:
    return EngagementService(db).create_review(payload)


@router.get("/tracking/{order_number}", response_model=TrackingRead)
def track_order(order_number: str, db: Annotated[Session, Depends(get_db)]) -> TrackingRead:
    return EngagementService(db).get_tracking(order_number)


@router.get("/admin/reviews", response_model=list[ReviewRead])
def list_reviews(_: Annotated[User, Depends(require_roles("admin", "manager", "support"))], db: Annotated[Session, Depends(get_db)]) -> list[ReviewRead]:
    return EngagementService(db).list_reviews()


@router.patch("/admin/reviews/{review_id}", response_model=ReviewRead)
def moderate_review(review_id: uuid.UUID, payload: ReviewModerationUpdate, _: Annotated[User, Depends(require_roles("admin", "manager", "support"))], db: Annotated[Session, Depends(get_db)]) -> ReviewRead:
    return EngagementService(db).moderate_review(review_id, payload)


@router.get("/admin/notifications", response_model=list[NotificationRead])
def list_notifications(_: Annotated[User, Depends(require_roles("admin", "manager", "support"))], db: Annotated[Session, Depends(get_db)]) -> list[NotificationRead]:
    return EngagementService(db).list_notifications()


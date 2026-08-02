import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_roles
from app.database.session import get_db
from app.models.user import User
from app.schemas.admin import (
    AdminCustomerRead,
    AdminDashboardRead,
    AdminOrderStatusUpdate,
    CouponCreate,
    CouponRead,
    CouponUpdate,
    ShippingMethodCreate,
    ShippingMethodRead,
    ShippingMethodUpdate,
)
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.schemas.checkout import OrderRead
from app.schemas.integrations import IntegrationStatusRead
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.schemas.supplier import SupplierOrderPayloadRead, SupplierProductImportRequest, SupplierProductRead, SupplierSubmissionUpdate, SupplierTrackingUpdate
from app.services.admin import AdminService
from app.services.catalog import CatalogService
from app.services.supplier import SupplierService
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["Admin"])
AdminUser = Annotated[User, Depends(require_roles("admin", "manager"))]


def customer_to_read(user: User) -> AdminCustomerRead:
    return AdminCustomerRead.model_validate({**user.__dict__, "roles": user.role_names})


@router.get("/dashboard", response_model=AdminDashboardRead)
def dashboard(_: AdminUser, db: Annotated[Session, Depends(get_db)]) -> AdminDashboardRead:
    return AdminService(db).dashboard()


@router.get("/integrations/status", response_model=IntegrationStatusRead)
def integration_status(_: AdminUser) -> IntegrationStatusRead:
    return IntegrationStatusRead(
        stripe_secret_configured=bool(settings.stripe_secret_key),
        stripe_webhook_configured=bool(settings.stripe_webhook_secret),
        supplier_provider=settings.supplier_provider,
        cj_configured=bool(settings.cj_api_key or settings.cj_platform_token),
        cj_sandbox=settings.cj_sandbox,
        email_provider=settings.email_provider or "log",
        email_configured=bool(settings.email_api_key),
        frontend_url=str(settings.frontend_url),
    )


@router.post("/categories", response_model=CategoryRead, status_code=201)
def create_category(payload: CategoryCreate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> CategoryRead:
    return CatalogService(db).create_category(payload)


@router.patch("/categories/{category_id}", response_model=CategoryRead)
def update_category(category_id: uuid.UUID, payload: CategoryUpdate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> CategoryRead:
    return CatalogService(db).update_category(category_id, payload)


@router.post("/products", response_model=ProductRead, status_code=201)
def create_product(payload: ProductCreate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> ProductRead:
    return CatalogService(db).create_product(payload)


@router.patch("/products/{product_id}", response_model=ProductRead)
def update_product(product_id: uuid.UUID, payload: ProductUpdate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> ProductRead:
    return CatalogService(db).update_product(product_id, payload)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: uuid.UUID, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> Response:
    CatalogService(db).delete_product(product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/products", response_model=list[ProductRead])
def list_admin_products(_: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[ProductRead]:
    return CatalogService(db).list_products(limit=100, sort="newest")


@router.get("/orders", response_model=list[OrderRead])
def list_orders(_: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[OrderRead]:
    return AdminService(db).list_orders()


@router.patch("/orders/{order_number}", response_model=OrderRead)
def update_order(order_number: str, payload: AdminOrderStatusUpdate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> OrderRead:
    return AdminService(db).update_order_status(order_number, payload.status, payload.note)


@router.get("/customers", response_model=list[AdminCustomerRead])
def list_customers(_: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[AdminCustomerRead]:
    return [customer_to_read(user) for user in AdminService(db).list_customers()]


@router.get("/coupons", response_model=list[CouponRead])
def list_coupons(_: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[CouponRead]:
    return AdminService(db).list_coupons()


@router.post("/coupons", response_model=CouponRead, status_code=201)
def create_coupon(payload: CouponCreate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> CouponRead:
    return AdminService(db).create_coupon(payload)


@router.patch("/coupons/{coupon_id}", response_model=CouponRead)
def update_coupon(coupon_id: uuid.UUID, payload: CouponUpdate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> CouponRead:
    return AdminService(db).update_coupon(coupon_id, payload)


@router.get("/shipping-methods", response_model=list[ShippingMethodRead])
def list_shipping_methods(_: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[ShippingMethodRead]:
    return AdminService(db).list_shipping_methods()


@router.post("/shipping-methods", response_model=ShippingMethodRead, status_code=201)
def create_shipping_method(payload: ShippingMethodCreate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> ShippingMethodRead:
    return AdminService(db).create_shipping_method(payload)


@router.patch("/shipping-methods/{method_id}", response_model=ShippingMethodRead)
def update_shipping_method(method_id: uuid.UUID, payload: ShippingMethodUpdate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> ShippingMethodRead:
    return AdminService(db).update_shipping_method(method_id, payload)


@router.get("/supplier/orders", response_model=list[OrderRead])
def list_supplier_orders(_: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[OrderRead]:
    return SupplierService(db).list_pending()


@router.get("/supplier/cj/products", response_model=list[SupplierProductRead])
def search_cj_products(q: Annotated[str, Query(min_length=2)], _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[SupplierProductRead]:
    return SupplierService(db).search_cj_products(q)


@router.post("/supplier/cj/import", response_model=ProductRead, status_code=201)
def import_cj_product(payload: SupplierProductImportRequest, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> ProductRead:
    return SupplierService(db).import_cj_product(payload)


@router.get("/supplier/orders/{order_number}/payload", response_model=SupplierOrderPayloadRead)
def get_supplier_payload(order_number: str, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> SupplierOrderPayloadRead:
    return SupplierService(db).get_copyable_payload(order_number)


@router.post("/supplier/orders/{order_number}/submitted", response_model=OrderRead)
def mark_supplier_submitted(order_number: str, payload: SupplierSubmissionUpdate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> OrderRead:
    return SupplierService(db).mark_submitted(order_number, payload)


@router.post("/supplier/orders/{order_number}/tracking", response_model=OrderRead)
def add_supplier_tracking(order_number: str, payload: SupplierTrackingUpdate, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> OrderRead:
    return SupplierService(db).add_tracking(order_number, payload)


@router.post("/supplier/orders/{order_number}/sync", response_model=OrderRead)
def sync_supplier_order(order_number: str, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> OrderRead:
    return SupplierService(db).sync_supplier_order(order_number)

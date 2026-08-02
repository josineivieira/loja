import hashlib
import hmac
import json
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.dependencies.auth import require_roles
from app.database.session import get_db
from app.integrations.aliexpress.client import AliExpressClient
from app.integrations.aliexpress.exceptions import AliExpressError
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
from app.schemas.integrations import AliExpressAuthUrlRead, AliExpressOAuthCallbackRead, IntegrationStatusRead
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.schemas.supplier import (
    SupplierOrderPayloadRead,
    SupplierProductImportRequest,
    SupplierProductRead,
    SupplierSubmissionUpdate,
    SupplierTrackingUpdate,
    SupplierVariantShippingEstimateRead,
    SupplierVariantShippingEstimateRequest,
)
from app.services.admin import AdminService
from app.services.catalog import CatalogService
from app.services.supplier import SupplierService
from app.core.config import settings

router = APIRouter(prefix="/admin", tags=["Admin"])
AdminUser = Annotated[User, Depends(require_roles("admin", "manager"))]
ALIEXPRESS_CALLBACK_URL = "https://nexora-backend-5pu6.onrender.com/api/admin/aliexpress/oauth/callback"


def customer_to_read(user: User) -> AdminCustomerRead:
    return AdminCustomerRead.model_validate({**user.__dict__, "roles": user.role_names})


def _read_json_response(response: object) -> dict[str, object]:
    raw_body = response.read().decode("utf-8")
    try:
        parsed = json.loads(raw_body)
    except json.JSONDecodeError:
        return {"raw": raw_body}
    if isinstance(parsed, dict):
        return parsed
    return {"raw": parsed}


def _post_form(url: str, payload: dict[str, str]) -> dict[str, object]:
    encoded = urllib.parse.urlencode(payload).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=encoded,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        return _read_json_response(response)


def _post_aliexpress_rest(api_path: str, payload: dict[str, str]) -> dict[str, object]:
    request_payload = {
        "app_key": settings.aliexpress_app_key,
        "timestamp": str(int(time.time() * 1000)),
        "sign_method": "sha256",
        **payload,
    }
    source = api_path + "".join(f"{key}{request_payload[key]}" for key in sorted(request_payload))
    signature = hmac.new(
        settings.aliexpress_app_secret.encode("utf-8"),
        source.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest().upper()
    request_payload["sign"] = signature
    return _post_form(f"https://api-sg.aliexpress.com/rest{api_path}", request_payload)


def _token_value(data: dict[str, object], *keys: str) -> str | None:
    for key in keys:
        value = data.get(key)
        if isinstance(value, str) and value:
            return value
    nested = data.get("result")
    if isinstance(nested, dict):
        for key in keys:
            value = nested.get(key)
            if isinstance(value, str) and value:
                return value
    return None


def _int_token_value(data: dict[str, object], *keys: str) -> int | None:
    for key in keys:
        value = data.get(key)
        if value not in (None, ""):
            try:
                return int(value)
            except (TypeError, ValueError):
                pass
    nested = data.get("result")
    if isinstance(nested, dict):
        for key in keys:
            value = nested.get(key)
            if value not in (None, ""):
                try:
                    return int(value)
                except (TypeError, ValueError):
                    pass
    return None


def _exchange_aliexpress_code(code: str) -> AliExpressOAuthCallbackRead:
    attempts: list[tuple[str, dict[str, str]]] = []
    last_error = ""

    old_oauth_payload = {
        "grant_type": "authorization_code",
        "client_id": settings.aliexpress_app_key,
        "client_secret": settings.aliexpress_app_secret,
        "code": code,
        "redirect_uri": ALIEXPRESS_CALLBACK_URL,
    }
    token_attempts = [
        ("oauth.aliexpress.com/token", lambda: _post_form("https://oauth.aliexpress.com/token", old_oauth_payload)),
        ("api-sg.aliexpress.com/oauth/token", lambda: _post_form("https://api-sg.aliexpress.com/oauth/token", old_oauth_payload)),
        ("api-sg.aliexpress.com/rest/auth/token/create", lambda: _post_aliexpress_rest("/auth/token/create", {"code": code})),
        (
            "api-sg.aliexpress.com/rest/auth/token/create grant_type",
            lambda: _post_aliexpress_rest("/auth/token/create", {"code": code, "grant_type": "authorization_code"}),
        ),
    ]

    for source, exchange in token_attempts:
        try:
            data = exchange()
        except urllib.error.HTTPError as exc:
            try:
                error_data = _read_json_response(exc)
            except Exception:
                error_data = {"status": exc.code, "reason": exc.reason}
            attempts.append((source, {"error": str(error_data)}))
            last_error = f"{source}: {error_data}"
            continue
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            attempts.append((source, {"error": str(exc)}))
            last_error = f"{source}: {exc}"
            continue

        access_token = _token_value(data, "access_token", "accessToken")
        refresh_token = _token_value(data, "refresh_token", "refreshToken")
        if access_token or refresh_token:
            return AliExpressOAuthCallbackRead(
                code=code,
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=_int_token_value(data, "expires_in", "expire_time", "expires"),
                refresh_expires_in=_int_token_value(data, "refresh_token_expires_in", "refresh_expires_in"),
                user_id=_token_value(data, "user_id", "userId", "resource_owner"),
                account_platform=_token_value(data, "account_platform", "accountPlatform"),
                token_source=source,
                raw_response=data,
                message="AliExpress authorization completed. Copy the tokens to Render environment variables and do not share them publicly.",
            )

        attempts.append((source, {"response": json.dumps(data, ensure_ascii=True)[:500]}))
        last_error = f"{source}: {data}"

    return AliExpressOAuthCallbackRead(
        code=code,
        exchange_error=last_error or "AliExpress did not return tokens.",
        raw_response={"attempts": attempts},
        message="Authorization code received, but token exchange failed. Check ALIEXPRESS_APP_KEY, ALIEXPRESS_APP_SECRET and the AliExpress app status.",
    )


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
        aliexpress_configured=bool(settings.aliexpress_app_key and settings.aliexpress_app_secret and settings.aliexpress_access_token),
        aliexpress_sandbox=settings.aliexpress_sandbox,
        email_provider=settings.email_provider or "log",
        email_configured=bool(settings.email_api_key),
        frontend_url=str(settings.frontend_url),
    )


@router.get("/aliexpress/oauth/url", response_model=AliExpressAuthUrlRead)
def aliexpress_oauth_url(_: AdminUser) -> AliExpressAuthUrlRead:
    authorization_url = (
        "https://api-sg.aliexpress.com/oauth/authorize"
        f"?response_type=code&client_id={settings.aliexpress_app_key}"
        f"&redirect_uri={urllib.parse.quote(ALIEXPRESS_CALLBACK_URL, safe='')}"
        "&state=nexora-aliexpress"
    )
    return AliExpressAuthUrlRead(authorization_url=authorization_url, callback_url=ALIEXPRESS_CALLBACK_URL)


@router.get("/aliexpress/oauth/callback", response_model=AliExpressOAuthCallbackRead)
def aliexpress_oauth_callback(code: str | None = None, state: str | None = None, error: str | None = None) -> AliExpressOAuthCallbackRead:
    if error:
        return AliExpressOAuthCallbackRead(code=code, state=state, error=error, message="AliExpress authorization returned an error.")
    if not code:
        return AliExpressOAuthCallbackRead(state=state, message="AliExpress callback did not include an authorization code.")
    if not settings.aliexpress_app_key or not settings.aliexpress_app_secret:
        return AliExpressOAuthCallbackRead(
            code=code,
            state=state,
            message="Authorization code received. Configure ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET on Render, redeploy, then authorize again to exchange tokens.",
        )
    exchanged = _exchange_aliexpress_code(code)
    exchanged.state = state
    return exchanged


@router.post("/aliexpress/oauth/refresh")
def refresh_aliexpress_token(_: AdminUser) -> dict[str, object]:
    try:
        data = AliExpressClient().refresh_access_token()
    except AliExpressError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {
        "message": "AliExpress token refreshed. Copy any new access_token or refresh_token returned to Render.",
        "raw_response": data,
    }


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


@router.get("/supplier/cj/products/{supplier_product_id}", response_model=SupplierProductRead)
def preview_cj_product(supplier_product_id: str, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> SupplierProductRead:
    return SupplierService(db).preview_cj_product(supplier_product_id)


@router.post("/supplier/cj/shipping-estimate", response_model=list[SupplierVariantShippingEstimateRead])
def estimate_cj_shipping(payload: SupplierVariantShippingEstimateRequest, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[SupplierVariantShippingEstimateRead]:
    return SupplierService(db).estimate_cj_shipping(payload)


@router.post("/supplier/cj/import", response_model=ProductRead, status_code=201)
def import_cj_product(payload: SupplierProductImportRequest, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> ProductRead:
    try:
        return SupplierService(db).import_cj_product(payload)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Nao foi possivel importar este produto da CJ: {exc.__class__.__name__}",
        ) from exc


@router.get("/supplier/aliexpress/products", response_model=list[SupplierProductRead])
def search_aliexpress_products(q: Annotated[str, Query(min_length=2)], _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[SupplierProductRead]:
    return SupplierService(db).search_aliexpress_products(q)


@router.get("/supplier/aliexpress/products/{supplier_product_id}", response_model=SupplierProductRead)
def preview_aliexpress_product(supplier_product_id: str, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> SupplierProductRead:
    return SupplierService(db).preview_aliexpress_product(supplier_product_id)


@router.post("/supplier/aliexpress/shipping-estimate", response_model=list[SupplierVariantShippingEstimateRead])
def estimate_aliexpress_shipping(payload: SupplierVariantShippingEstimateRequest, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[SupplierVariantShippingEstimateRead]:
    return SupplierService(db).estimate_aliexpress_shipping(payload)


@router.post("/supplier/aliexpress/import", response_model=ProductRead, status_code=201)
def import_aliexpress_product(payload: SupplierProductImportRequest, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> ProductRead:
    try:
        return SupplierService(db).import_aliexpress_product(payload)
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Nao foi possivel importar este produto do AliExpress: {exc.__class__.__name__}",
        ) from exc


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

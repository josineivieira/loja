from typing import Any

from pydantic import BaseModel, Field


class IntegrationStatusRead(BaseModel):
    stripe_secret_configured: bool
    stripe_webhook_configured: bool
    supplier_provider: str
    cj_configured: bool
    cj_sandbox: bool
    aliexpress_configured: bool
    aliexpress_sandbox: bool
    email_provider: str
    email_configured: bool
    frontend_url: str


class AliExpressAuthUrlRead(BaseModel):
    authorization_url: str
    callback_url: str


class AliExpressOAuthCallbackRead(BaseModel):
    code: str | None = None
    state: str | None = None
    error: str | None = None
    access_token: str | None = None
    refresh_token: str | None = None
    expires_in: int | None = None
    refresh_expires_in: int | None = None
    user_id: str | None = None
    account_platform: str | None = None
    token_source: str | None = None
    exchange_error: str | None = None
    raw_response: dict[str, Any] = Field(default_factory=dict)
    message: str

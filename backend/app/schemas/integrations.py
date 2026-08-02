from pydantic import BaseModel


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

from functools import lru_cache

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

    database_url: str = "postgresql+psycopg://nexora:nexora_dev@localhost:5432/nexora"
    secret_key: str = "dev-secret"
    jwt_secret_key: str = "dev-jwt-secret"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    frontend_url: AnyHttpUrl | str = "http://localhost:5173"
    cors_origins: str = "http://localhost:5173"
    environment: str = "development"

    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    paypal_client_id: str = ""
    paypal_client_secret: str = ""
    email_provider: str = ""
    email_api_key: str = ""
    email_from: str = "no-reply@nexora.local"
    admin_email: str = "admin@nexora.local"
    admin_password: str = Field(default="", repr=False)
    supplier_provider: str = "manual"
    cj_api_key: str = ""
    cj_api_secret: str = Field(default="", repr=False)
    cj_base_url: str = "https://developers.cjdropshipping.com"
    cj_platform_token: str = Field(default="", repr=False)
    cj_sandbox: bool = False
    cj_default_logistic_name: str = "CJPacket"
    cj_default_from_country: str = "CN"
    cj_price_markup_multiplier: float = 2.2
    cj_price_markup_fixed: float = 4.9
    cj_shipping_markup_multiplier: float = 1.0
    cj_shipping_markup_fixed: float = 0
    aliexpress_app_key: str = ""
    aliexpress_app_secret: str = Field(default="", repr=False)
    aliexpress_access_token: str = Field(default="", repr=False)
    aliexpress_refresh_token: str = Field(default="", repr=False)
    aliexpress_sandbox: bool = True
    aliexpress_app_signature: str = "nexora"
    aliexpress_price_markup_multiplier: float = 2.2
    aliexpress_price_markup_fixed: float = 4.9
    aliexpress_shipping_markup_multiplier: float = 1.0
    aliexpress_shipping_markup_fixed: float = 0

    @field_validator("database_url")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+psycopg://", 1)
        if value.startswith("postgresql://"):
            return value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

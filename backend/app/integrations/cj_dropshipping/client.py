from app.core.config import settings


class CJDropshippingClient:
    def __init__(self) -> None:
        self.api_key = settings.cj_api_key
        self.api_secret = settings.cj_api_secret


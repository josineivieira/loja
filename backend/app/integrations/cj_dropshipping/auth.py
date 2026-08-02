from app.integrations.cj_dropshipping.client import CJDropshippingClient


class CJDropshippingAuth:
    def __init__(self, client: CJDropshippingClient):
        self.client = client


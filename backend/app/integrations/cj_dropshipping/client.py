import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from app.core.config import settings
from app.integrations.cj_dropshipping.exceptions import CJDropshippingError


class CJDropshippingClient:
    def __init__(self) -> None:
        self.api_key = settings.cj_api_key
        self.api_secret = settings.cj_api_secret
        self.base_url = str(settings.cj_base_url).rstrip("/")
        self.platform_token = settings.cj_platform_token
        self._access_token: str | None = None

    def access_token(self) -> str:
        if self._access_token:
            return self._access_token
        if self.platform_token:
            self._access_token = self.platform_token
            return self._access_token
        if not self.api_key:
            raise CJDropshippingError("CJ_API_KEY is required to authenticate with CJ Dropshipping.")
        result = self.post("/api2.0/v1/authentication/getAccessToken", {"apiKey": self.api_key}, authenticated=False)
        token = result.get("data", {}).get("accessToken") or result.get("data", {}).get("access_token")
        if not token:
            raise CJDropshippingError("CJ did not return an access token.")
        self._access_token = str(token)
        return self._access_token

    def get(self, path: str, params: dict[str, Any] | None = None, authenticated: bool = True) -> dict[str, Any]:
        query = ""
        if params:
            from urllib.parse import urlencode

            query = f"?{urlencode(params)}"
        return self._request("GET", f"{path}{query}", None, authenticated)

    def post(self, path: str, payload: dict[str, Any], authenticated: bool = True) -> dict[str, Any]:
        return self._request("POST", path, payload, authenticated)

    def _request(self, method: str, path: str, payload: dict[str, Any] | None, authenticated: bool) -> dict[str, Any]:
        body = json.dumps(payload or {}).encode("utf-8") if payload is not None else None
        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if authenticated:
            headers["CJ-Access-Token"] = self.access_token()
        request = Request(f"{self.base_url}{path}", data=body, headers=headers, method=method)
        try:
            with urlopen(request, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise CJDropshippingError(f"CJ API HTTP {exc.code}: {detail}") from exc
        except (URLError, TimeoutError) as exc:
            raise CJDropshippingError(f"CJ API request failed: {exc}") from exc
        if isinstance(data, dict) and str(data.get("code")) not in {"200", "0", "None"} and data.get("success") is False:
            raise CJDropshippingError(f"CJ API error: {data}")
        return data

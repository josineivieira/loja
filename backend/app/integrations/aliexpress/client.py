import hashlib
import hmac
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from app.core.config import settings
from app.integrations.aliexpress.exceptions import AliExpressError


class AliExpressClient:
    def __init__(self) -> None:
        self.app_key = settings.aliexpress_app_key
        self.app_secret = settings.aliexpress_app_secret
        self._access_token = settings.aliexpress_access_token
        self._refresh_token = settings.aliexpress_refresh_token
        self.base_url = "https://api-sg.aliexpress.com/rest"

    def configured(self) -> bool:
        return bool(self.app_key and self.app_secret and self._access_token)

    def refresh_access_token(self) -> dict[str, Any]:
        if not self._refresh_token:
            raise AliExpressError("ALIEXPRESS_REFRESH_TOKEN is missing.")
        data = self.call(
            "/auth/token/refresh",
            {"refresh_token": self._refresh_token},
            include_access_token=False,
        )
        access_token = self._token_value(data, "access_token", "accessToken")
        refresh_token = self._token_value(data, "refresh_token", "refreshToken")
        if access_token:
            self._access_token = access_token
        if refresh_token:
            self._refresh_token = refresh_token
        return data

    def call(self, api_path: str, payload: dict[str, Any] | None = None, include_access_token: bool = True) -> dict[str, Any]:
        if not self.app_key or not self.app_secret:
            raise AliExpressError("ALIEXPRESS_APP_KEY and ALIEXPRESS_APP_SECRET are required.")
        request_payload: dict[str, Any] = {
            "app_key": self.app_key,
            "timestamp": str(int(time.time() * 1000)),
            "sign_method": "sha256",
            **(payload or {}),
        }
        if include_access_token:
            if not self._access_token:
                raise AliExpressError("ALIEXPRESS_ACCESS_TOKEN is missing.")
            request_payload["access_token"] = self._access_token
        request_payload["sign"] = self._sign(api_path, request_payload)
        return self._post(f"{self.base_url}{api_path}", request_payload)

    def ds_method(self, method: str, payload: dict[str, Any]) -> dict[str, Any]:
        return self.call("/sync", {"method": method, **payload})

    def _sign(self, api_path: str, payload: dict[str, Any]) -> str:
        source = api_path + "".join(f"{key}{payload[key]}" for key in sorted(payload) if key != "sign")
        return hmac.new(self.app_secret.encode("utf-8"), source.encode("utf-8"), hashlib.sha256).hexdigest().upper()

    def _post(self, url: str, payload: dict[str, Any]) -> dict[str, Any]:
        encoded = urllib.parse.urlencode({key: self._encode_value(value) for key, value in payload.items()}).encode("utf-8")
        request = urllib.request.Request(url, data=encoded, headers={"Content-Type": "application/x-www-form-urlencoded"}, method="POST")
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise AliExpressError(f"AliExpress HTTP {exc.code}: {detail[:800]}") from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise AliExpressError(f"AliExpress request failed: {exc}") from exc
        try:
            data = json.loads(body)
        except json.JSONDecodeError as exc:
            raise AliExpressError("AliExpress returned a non-JSON response.") from exc
        if not isinstance(data, dict):
            raise AliExpressError("AliExpress returned an unexpected response.")
        if str(data.get("code", "0")) not in {"0", "200", "SUCCESS"} and data.get("error_response"):
            raise AliExpressError(str(data.get("error_response")))
        return data

    def _encode_value(self, value: Any) -> str:
        if isinstance(value, (dict, list)):
            return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
        return str(value)

    def _token_value(self, data: dict[str, Any], *keys: str) -> str | None:
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

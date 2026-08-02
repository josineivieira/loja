from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.core.rate_limit import InMemoryRateLimiter


def test_rate_limiter_blocks_sensitive_paths() -> None:
    limiter = InMemoryRateLimiter(max_requests=2, window_seconds=60)
    request = SimpleNamespace(url=SimpleNamespace(path="/api/auth/login"), client=SimpleNamespace(host="127.0.0.1"))

    limiter.check(request)
    limiter.check(request)

    with pytest.raises(HTTPException):
        limiter.check(request)


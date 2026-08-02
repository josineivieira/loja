from collections import defaultdict, deque
from time import monotonic

from fastapi import HTTPException, Request, status

SENSITIVE_PREFIXES = ("/api/auth/login", "/api/auth/register", "/api/checkout", "/api/webhooks")


class InMemoryRateLimiter:
    def __init__(self, max_requests: int = 120, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def check(self, request: Request) -> None:
        if not request.url.path.startswith(SENSITIVE_PREFIXES):
            return
        client_ip = request.client.host if request.client else "unknown"
        key = f"{client_ip}:{request.url.path}"
        now = monotonic()
        hits = self._hits[key]
        while hits and now - hits[0] > self.window_seconds:
            hits.popleft()
        if len(hits) >= self.max_requests:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many requests")
        hits.append(now)


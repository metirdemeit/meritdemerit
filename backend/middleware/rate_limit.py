import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse

_request_log: dict[str, list[float]] = defaultdict(list)

RATE_LIMIT = 60
RATE_WINDOW = 60


async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    timestamps = _request_log[client_ip]
    _request_log[client_ip] = [t for t in timestamps if now - t < RATE_WINDOW]

    if len(_request_log[client_ip]) >= RATE_LIMIT:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Too many requests. Please try again later."},
        )

    _request_log[client_ip].append(now)
    return await call_next(request)

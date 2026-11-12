import os
import time
from collections import defaultdict
from fastapi import Request, status
from fastapi.responses import JSONResponse

_request_log: dict[str, list[float]] = defaultdict(list)

# A whole school usually shares one public IP (school Wi-Fi / NAT), so the
# per-IP budget has to cover many people at once.
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "600"))
RATE_WINDOW = 60
_last_sweep = 0.0


def _client_ip(request: Request) -> str:
    cf_ip = request.headers.get("cf-connecting-ip")
    if cf_ip:
        return cf_ip.strip()
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def rate_limit_middleware(request: Request, call_next):
    global _last_sweep
    if request.method == "OPTIONS":
        return await call_next(request)

    now = time.time()
    # Drop idle IPs so the table does not grow forever.
    if now - _last_sweep > RATE_WINDOW:
        for ip in [ip for ip, ts in _request_log.items() if not ts or now - ts[-1] >= RATE_WINDOW]:
            del _request_log[ip]
        _last_sweep = now

    client_ip = _client_ip(request)
    timestamps = [t for t in _request_log[client_ip] if now - t < RATE_WINDOW]

    if len(timestamps) >= RATE_LIMIT:
        _request_log[client_ip] = timestamps
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Too many requests. Please try again in a minute."},
        )

    timestamps.append(now)
    _request_log[client_ip] = timestamps
    return await call_next(request)

import json
import time
import logging
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse, Response as StarletteResponse

logger = logging.getLogger("api.access")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)


async def log_requests(request: Request, call_next: Callable) -> Response:
    start_time = time.time()
    method = request.method
    path = request.url.path
    query = str(request.query_params) if request.query_params else ""

    request_body = None
    if method in ("POST", "PUT", "PATCH", "DELETE"):
        try:
            body_bytes = await request.body()
            if body_bytes:
                try:
                    request_body = json.loads(body_bytes)
                except Exception:
                    request_body = body_bytes.decode("utf-8", errors="replace")
        except Exception:
            request_body = "<error reading body>"

    logger.info("=" * 60)
    logger.info(">>> %s %s%s", method, path, f"?{query}" if query else "")
    logger.info("    Headers: %s", json.dumps(dict(request.headers), ensure_ascii=False, default=str))
    if request_body is not None:
        logger.info("    Body: %s", json.dumps(request_body, ensure_ascii=False, default=str))

    try:
        response = await call_next(request)
        elapsed = time.time() - start_time

        # Read streaming response body
        response_body_bytes = b""
        async for chunk in response.body_iterator:
            if isinstance(chunk, str):
                response_body_bytes += chunk.encode("utf-8")
            else:
                response_body_bytes += chunk

        response_body = None
        if response_body_bytes:
            try:
                response_body = json.loads(response_body_bytes)
            except Exception:
                response_body = response_body_bytes.decode("utf-8", errors="replace")

        logger.info("<<< %s %s -> %s (%.3fs)", method, path, response.status_code, elapsed)
        if response_body is not None:
            logger.info("    Response: %s", json.dumps(response_body, ensure_ascii=False, default=str))
        logger.info("=" * 60)

        return StarletteResponse(
            content=response_body_bytes,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )

    except Exception as e:
        elapsed = time.time() - start_time
        logger.error("<<< %s %s -> 500 EXCEPTION (%.3fs) %s: %s", method, path, elapsed, type(e).__name__, e)
        logger.info("=" * 60)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error"},
        )

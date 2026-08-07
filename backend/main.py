import os
from contextlib import asynccontextmanager
import asyncio
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.responses import JSONResponse
from tortoise import Tortoise

from backend.routes import webapp_auth, students, teachers, admin, common
from backend.config import TORTOISE_ORM, DOCS_SECRET
from backend.middleware.logging import log_requests
from backend.middleware.rate_limit import rate_limit_middleware
from bot.app import build_bot, build_dispatcher


@asynccontextmanager
async def lifespan(app: FastAPI):
    bot_task: asyncio.Task | None = None

    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
    try:
        run_bot = os.getenv("RUN_BOT", "true").lower() in {"1", "true", "yes"}
        if run_bot:
            bot = build_bot()
            dp = build_dispatcher()

            async def _run():
                await bot.delete_webhook(drop_pending_updates=True)
                await dp.start_polling(bot)

            bot_task = asyncio.create_task(_run())
            logging.getLogger(__name__).info("Telegram bot polling started")

        yield
    finally:
        if bot_task:
            bot_task.cancel()
            try:
                await bot_task
            except Exception:
                pass
        await Tortoise.close_connections()


app = FastAPI(
    title="School Discipline Bot API",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
)

app.middleware("http")(rate_limit_middleware)
app.middleware("http")(log_requests)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(common.router, prefix="", tags=["Common"])
app.include_router(webapp_auth.router, prefix="/auth", tags=["WebApp Auth"])
app.include_router(students.router, prefix="/students", tags=["Students"])
app.include_router(teachers.router, prefix="/teacher", tags=["Teachers"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])


@app.get("/")
async def root():
    return {"message": "School Discipline Bot API"}


@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui(request: Request):
    key = request.query_params.get("key")
    if not DOCS_SECRET or key != DOCS_SECRET:
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    return get_swagger_ui_html(
        openapi_url=f"/openapi.json?key={DOCS_SECRET}",
        title=app.title + " - Docs",
    )


@app.get("/redoc", include_in_schema=False)
async def custom_redoc(request: Request):
    key = request.query_params.get("key")
    if not DOCS_SECRET or key != DOCS_SECRET:
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    return get_redoc_html(
        openapi_url=f"/openapi.json?key={DOCS_SECRET}",
        title=app.title + " - ReDoc",
    )


@app.get("/openapi.json", include_in_schema=False)
async def custom_openapi(request: Request):
    key = request.query_params.get("key")
    if not DOCS_SECRET or key != DOCS_SECRET:
        return JSONResponse(status_code=404, content={"detail": "Not Found"})
    return app.openapi()

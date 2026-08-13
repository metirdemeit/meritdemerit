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

    # Apply pending schema changes safely via raw SQL (idempotent)
    conn = Tortoise.get_connection("default")
    try:
        migration_stmts = [
            # Migration 3: add access_level to disciplinerule
            'ALTER TABLE "disciplinerule" ADD COLUMN IF NOT EXISTS "access_level" VARCHAR(20) NOT NULL DEFAULT \'all\'',
            # Migration 3: add homeroom_class_id to teacher
            'ALTER TABLE "teacher" ADD COLUMN IF NOT EXISTS "homeroom_class_id" INT REFERENCES "class" ("id") ON DELETE SET NULL',
            # Migration 3: create limit_md table
            """CREATE TABLE IF NOT EXISTS "limit_md" (
                "id"           SERIAL NOT NULL PRIMARY KEY,
                "max_uses"     INT NOT NULL DEFAULT 1,
                "reset_type"   VARCHAR(20) NOT NULL DEFAULT 'period',
                "reset_period" VARCHAR(20) DEFAULT 'weekly',
                "reset_date"   DATE,
                "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "rule_id"      INT NOT NULL UNIQUE REFERENCES "disciplinerule" ("id") ON DELETE CASCADE
            )""",
            # Migration 3: create intervention table
            """CREATE TABLE IF NOT EXISTS "intervention" (
                "id"              SERIAL NOT NULL PRIMARY KEY,
                "level"           VARCHAR(20) NOT NULL,
                "status"          VARCHAR(20) NOT NULL DEFAULT 'pending',
                "parent_notified" BOOL NOT NULL DEFAULT FALSE,
                "notes"           TEXT,
                "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "student_id"      INT NOT NULL REFERENCES "student" ("id") ON DELETE CASCADE
            )""",
            'CREATE INDEX IF NOT EXISTS "idx_intervention_student" ON "intervention" ("student_id")',
            'CREATE INDEX IF NOT EXISTS "idx_intervention_status"  ON "intervention" ("status")',
            # Migration 2: create exam_week table
            """CREATE TABLE IF NOT EXISTS "exam_week" (
                "id"         SERIAL NOT NULL PRIMARY KEY,
                "title"      VARCHAR(100) NOT NULL,
                "start_date" DATE NOT NULL,
                "end_date"   DATE NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )""",
            # Migration 2: create detention_history table
            """CREATE TABLE IF NOT EXISTS "detention_history" (
                "id"                 SERIAL NOT NULL PRIMARY KEY,
                "start_date"         DATE NOT NULL,
                "end_date"           DATE NOT NULL,
                "status"             VARCHAR(20) NOT NULL DEFAULT 'active',
                "notes"              TEXT,
                "probation_end_date" DATE,
                "is_exam_bypass"     BOOL NOT NULL DEFAULT FALSE,
                "exam_week_title"    VARCHAR(100),
                "created_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updated_at"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "student_id"         INT NOT NULL REFERENCES "student" ("id") ON DELETE CASCADE,
                "assigned_by_id"     INT REFERENCES "teacher" ("id") ON DELETE SET NULL
            )""",
            'CREATE INDEX IF NOT EXISTS "idx_detention_student" ON "detention_history" ("student_id")',
            'CREATE INDEX IF NOT EXISTS "idx_detention_status"  ON "detention_history" ("status")',
        ]
        for stmt in migration_stmts:
            await conn.execute_query(stmt)
        logging.getLogger(__name__).info("Database schema migrations applied successfully")
    except Exception as e:
        logging.getLogger(__name__).error(f"Schema migration error: {e}")

    # Create any remaining tables not covered by manual migrations
    await Tortoise.generate_schemas(safe=True)

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

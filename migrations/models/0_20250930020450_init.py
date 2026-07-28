from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "admin" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "telegram_id" BIGINT UNIQUE,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255)
);
COMMENT ON TABLE "admin" IS 'Admin model.';
CREATE TABLE IF NOT EXISTS "class" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(10) NOT NULL UNIQUE
);
COMMENT ON TABLE "class" IS 'Class model for school classes like 6А, 11Б, etc.';
CREATE TABLE IF NOT EXISTS "disciplinerule" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "points" INT NOT NULL
);
COMMENT ON TABLE "disciplinerule" IS 'Discipline rule model.';
CREATE TABLE IF NOT EXISTS "student" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "telegram_id" BIGINT UNIQUE,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255),
    "points" INT NOT NULL DEFAULT 100,
    "school_class_id" INT NOT NULL REFERENCES "class" ("id") ON DELETE CASCADE
);
COMMENT ON TABLE "student" IS 'Student model.';
CREATE TABLE IF NOT EXISTS "teacher" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "telegram_id" BIGINT UNIQUE,
    "username" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255)
);
COMMENT ON TABLE "teacher" IS 'Teacher model.';
CREATE TABLE IF NOT EXISTS "pointhistory" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "points_changed" INT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rule_id" INT NOT NULL REFERENCES "disciplinerule" ("id") ON DELETE CASCADE,
    "student_id" INT NOT NULL REFERENCES "student" ("id") ON DELETE CASCADE,
    "teacher_id" INT NOT NULL REFERENCES "teacher" ("id") ON DELETE CASCADE
);
COMMENT ON TABLE "pointhistory" IS 'Points history model.';
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """

from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "adminpointhistory" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "points_changed" INT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "admin_id" INT NOT NULL REFERENCES "admin" ("id") ON DELETE CASCADE,
    "rule_id" INT NOT NULL REFERENCES "disciplinerule" ("id") ON DELETE CASCADE,
    "student_id" INT NOT NULL REFERENCES "student" ("id") ON DELETE CASCADE
);
        ALTER TABLE "disciplinerule" ADD "type" VARCHAR(10) NOT NULL DEFAULT 'merit';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "disciplinerule" DROP COLUMN "type";
        DROP TABLE IF EXISTS "adminpointhistory";"""

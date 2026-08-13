from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "disciplinerule" ADD COLUMN IF NOT EXISTS "access_level" VARCHAR(20) NOT NULL DEFAULT 'all';
        ALTER TABLE "teacher" ADD COLUMN IF NOT EXISTS "homeroom_class_id" INT REFERENCES "class" ("id") ON DELETE SET NULL;

        CREATE TABLE IF NOT EXISTS "limit_md" (
            "id"           SERIAL NOT NULL PRIMARY KEY,
            "max_uses"     INT NOT NULL DEFAULT 1,
            "reset_type"   VARCHAR(20) NOT NULL DEFAULT 'period',
            "reset_period" VARCHAR(20) DEFAULT 'weekly',
            "reset_date"   DATE,
            "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "rule_id"      INT NOT NULL UNIQUE REFERENCES "disciplinerule" ("id") ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS "intervention" (
            "id"              SERIAL NOT NULL PRIMARY KEY,
            "level"           VARCHAR(20) NOT NULL,
            "status"          VARCHAR(20) NOT NULL DEFAULT 'pending',
            "parent_notified" BOOL NOT NULL DEFAULT FALSE,
            "notes"           TEXT,
            "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            "student_id"      INT NOT NULL REFERENCES "student" ("id") ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS "idx_intervention_student" ON "intervention" ("student_id");
        CREATE INDEX IF NOT EXISTS "idx_intervention_status"  ON "intervention" ("status");
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "intervention";
        DROP TABLE IF EXISTS "limit_md";
        ALTER TABLE "teacher" DROP COLUMN IF EXISTS "homeroom_class_id";
        ALTER TABLE "disciplinerule" DROP COLUMN IF EXISTS "access_level";
    """

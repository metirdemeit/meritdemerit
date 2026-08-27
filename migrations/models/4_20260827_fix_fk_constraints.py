from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        -- PointHistory: make rule_id nullable (SET NULL when rule deleted)
        ALTER TABLE "pointhistory" DROP CONSTRAINT IF EXISTS "pointhistory_rule_id_fkey";
        ALTER TABLE "pointhistory" ALTER COLUMN "rule_id" DROP NOT NULL;
        ALTER TABLE "pointhistory"
            ADD CONSTRAINT "pointhistory_rule_id_fkey"
            FOREIGN KEY ("rule_id") REFERENCES "disciplinerule" ("id") ON DELETE SET NULL;

        -- PointHistory: make teacher_id nullable (already nullable, fix CASCADE → SET NULL)
        ALTER TABLE "pointhistory" DROP CONSTRAINT IF EXISTS "pointhistory_teacher_id_fkey";
        ALTER TABLE "pointhistory"
            ADD CONSTRAINT "pointhistory_teacher_id_fkey"
            FOREIGN KEY ("teacher_id") REFERENCES "teacher" ("id") ON DELETE SET NULL;

        -- PointHistory: student CASCADE is correct, keep as-is

        -- AdminPointHistory: make rule_id nullable (SET NULL when rule deleted)
        ALTER TABLE "adminpointhistory" DROP CONSTRAINT IF EXISTS "adminpointhistory_rule_id_fkey";
        ALTER TABLE "adminpointhistory" ALTER COLUMN "rule_id" DROP NOT NULL;
        ALTER TABLE "adminpointhistory"
            ADD CONSTRAINT "adminpointhistory_rule_id_fkey"
            FOREIGN KEY ("rule_id") REFERENCES "disciplinerule" ("id") ON DELETE SET NULL;

        -- AdminPointHistory: make admin_id nullable (SET NULL when admin deleted)
        ALTER TABLE "adminpointhistory" DROP CONSTRAINT IF EXISTS "adminpointhistory_admin_id_fkey";
        ALTER TABLE "adminpointhistory" ALTER COLUMN "admin_id" DROP NOT NULL;
        ALTER TABLE "adminpointhistory"
            ADD CONSTRAINT "adminpointhistory_admin_id_fkey"
            FOREIGN KEY ("admin_id") REFERENCES "admin" ("id") ON DELETE SET NULL;

        -- Performance indexes on commonly filtered columns
        CREATE INDEX IF NOT EXISTS "idx_pointhistory_student"   ON "pointhistory" ("student_id");
        CREATE INDEX IF NOT EXISTS "idx_pointhistory_teacher"   ON "pointhistory" ("teacher_id");
        CREATE INDEX IF NOT EXISTS "idx_pointhistory_rule"      ON "pointhistory" ("rule_id");
        CREATE INDEX IF NOT EXISTS "idx_pointhistory_created"   ON "pointhistory" ("created_at" DESC);

        CREATE INDEX IF NOT EXISTS "idx_adminpointhistory_student" ON "adminpointhistory" ("student_id");
        CREATE INDEX IF NOT EXISTS "idx_adminpointhistory_admin"   ON "adminpointhistory" ("admin_id");
        CREATE INDEX IF NOT EXISTS "idx_adminpointhistory_rule"    ON "adminpointhistory" ("rule_id");
        CREATE INDEX IF NOT EXISTS "idx_adminpointhistory_created" ON "adminpointhistory" ("created_at" DESC);

        -- Student index on telegram_id for fast Quick-login lookup
        CREATE INDEX IF NOT EXISTS "idx_student_telegram_id"  ON "student"  ("telegram_id");
        CREATE INDEX IF NOT EXISTS "idx_teacher_telegram_id"  ON "teacher"  ("telegram_id");
        CREATE INDEX IF NOT EXISTS "idx_admin_telegram_id"    ON "admin"    ("telegram_id");

        -- Student index on points for fast ranking queries
        CREATE INDEX IF NOT EXISTS "idx_student_points" ON "student" ("points" DESC);
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        -- Restore original NOT NULL CASCADE constraints (rollback)
        ALTER TABLE "pointhistory" DROP CONSTRAINT IF EXISTS "pointhistory_rule_id_fkey";
        ALTER TABLE "pointhistory" ALTER COLUMN "rule_id" SET NOT NULL;
        ALTER TABLE "pointhistory"
            ADD CONSTRAINT "pointhistory_rule_id_fkey"
            FOREIGN KEY ("rule_id") REFERENCES "disciplinerule" ("id") ON DELETE CASCADE;

        ALTER TABLE "adminpointhistory" DROP CONSTRAINT IF EXISTS "adminpointhistory_rule_id_fkey";
        ALTER TABLE "adminpointhistory" ALTER COLUMN "rule_id" SET NOT NULL;
        ALTER TABLE "adminpointhistory"
            ADD CONSTRAINT "adminpointhistory_rule_id_fkey"
            FOREIGN KEY ("rule_id") REFERENCES "disciplinerule" ("id") ON DELETE CASCADE;

        ALTER TABLE "adminpointhistory" DROP CONSTRAINT IF EXISTS "adminpointhistory_admin_id_fkey";
        ALTER TABLE "adminpointhistory" ALTER COLUMN "admin_id" SET NOT NULL;
        ALTER TABLE "adminpointhistory"
            ADD CONSTRAINT "adminpointhistory_admin_id_fkey"
            FOREIGN KEY ("admin_id") REFERENCES "admin" ("id") ON DELETE CASCADE;
    """

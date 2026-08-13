from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "exam_week" (
            "id"         SERIAL NOT NULL PRIMARY KEY,
            "title"      VARCHAR(100) NOT NULL,
            "start_date" DATE NOT NULL,
            "end_date"   DATE NOT NULL,
            "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS "detention_history" (
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
        );

        CREATE INDEX IF NOT EXISTS "idx_detention_student" ON "detention_history" ("student_id");
        CREATE INDEX IF NOT EXISTS "idx_detention_status"  ON "detention_history" ("status");
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        DROP TABLE IF EXISTS "detention_history";
        DROP TABLE IF EXISTS "exam_week";
    """

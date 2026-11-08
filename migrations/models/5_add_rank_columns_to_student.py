from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "previous_rank" INT NULL;
        ALTER TABLE "student" ADD COLUMN IF NOT EXISTS "current_rank" INT NULL;

        -- Populate current_rank with the initial rank based on current points
        -- (previous_rank stays NULL — no prior rank exists yet)
        UPDATE "student"
        SET "current_rank" = ranked.rn
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (ORDER BY points DESC, id ASC) AS rn
            FROM "student"
        ) AS ranked
        WHERE "student".id = ranked.id;
    """


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "student" DROP COLUMN IF EXISTS "previous_rank";
        ALTER TABLE "student" DROP COLUMN IF EXISTS "current_rank";
    """

# backend/utils/ranking_helper.py
import logging
from tortoise.transactions import in_transaction
from backend.models import Student, Class

logger = logging.getLogger(__name__)


async def recalculate_ranks():
    """
    Recalculates current_rank and rotates previous_rank for all students and classes.
    previous_rank <- current_rank
    current_rank  <- new rank sorted by points DESC, id ASC
    """
    try:
        async with in_transaction() as conn:
            # 1. Update students: previous_rank <- current_rank, then current_rank <- new row_number
            await conn.execute_query("""
                WITH ranked_students AS (
                    SELECT id, 
                           ROW_NUMBER() OVER (ORDER BY points DESC, id ASC) as new_rank
                    FROM "student"
                )
                UPDATE "student" s
                SET previous_rank = COALESCE(s.current_rank, r.new_rank),
                    current_rank = r.new_rank
                FROM ranked_students r
                WHERE s.id = r.id;
            """)

            # 2. Update classes: previous_rank <- current_rank, then current_rank <- new row_number
            await conn.execute_query("""
                WITH ranked_classes AS (
                    SELECT c.id,
                           ROW_NUMBER() OVER (ORDER BY COALESCE(AVG(s.points), 0) DESC, c.id ASC) as new_rank
                    FROM "class" c
                    LEFT JOIN "student" s ON s.school_class_id = c.id
                    GROUP BY c.id
                )
                UPDATE "class" c
                SET previous_rank = COALESCE(c.current_rank, rc.new_rank),
                    current_rank = rc.new_rank
                FROM ranked_classes rc
                WHERE c.id = rc.id;
            """)
    except Exception as e:
        logger.error(f"Error recalculating ranks: {e}")

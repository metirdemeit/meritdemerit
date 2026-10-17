"""
ranking_helper.py
~~~~~~~~~~~~~~~~~
Utility for atomically recalculating and persisting student ranks.

Usage after any point change:
    from backend.utils.ranking_helper import recalculate_ranks
    await recalculate_ranks()

How it works:
  1. Fetch every student ordered by points DESC, id ASC (stable tie-break).
  2. For each student:
       previous_rank = current_rank   (shift the stored rank down)
       current_rank  = new position
  3. Bulk-update only the rank columns to keep it efficient.
"""
from backend.models import Student


async def recalculate_ranks() -> None:
    """
    Recalculate and persist `previous_rank` and `current_rank` for all students.
    Should be called inside (or immediately after) any transaction that changes points.
    """
    # Stable ordering: highest points first, lower id wins ties
    students = await Student.all().order_by("-points", "id")

    update_tasks = []
    for rank, student in enumerate(students, start=1):
        new_previous = student.current_rank  # what was current becomes previous
        new_current = rank

        # Skip if nothing changed (saves unnecessary DB writes)
        if student.previous_rank == new_previous and student.current_rank == new_current:
            continue

        student.previous_rank = new_previous
        student.current_rank = new_current
        update_tasks.append(
            student.save(update_fields=["previous_rank", "current_rank"])
        )

    # Run all saves concurrently for performance
    if update_tasks:
        import asyncio
        await asyncio.gather(*update_tasks)

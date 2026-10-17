from backend.models import Student


async def recalculate_ranks() -> None:
    """
    Recalculate and persist  and  for all students.
    Only shifts previous_rank when current_rank actually changes, preventing
    cascading and stale overwrites.
    """
    students = await Student.all().order_by("-points", "id")

    update_tasks = []
    for rank, student in enumerate(students, start=1):
        # Initial seeding case
        if student.current_rank is None:
            student.current_rank = rank
            student.previous_rank = rank
            update_tasks.append(
                student.save(update_fields=["previous_rank", "current_rank"])
            )
            continue

        # Rank has NOT changed -> do nothing, preserve previous_rank
        if student.current_rank == rank:
            continue

        # Rank HAS changed -> rotate previous_rank = current_rank, then set new current_rank
        student.previous_rank = student.current_rank
        student.current_rank = rank
        update_tasks.append(
            student.save(update_fields=["previous_rank", "current_rank"])
        )

    if update_tasks:
        import asyncio
        await asyncio.gather(*update_tasks)

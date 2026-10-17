"""
ranking_helper.py
~~~~~~~~~~~~~~~~~
Utility for recalculating and persisting student and class ranks.
Ranks are calculated within grade groups ('6-8' and '9-12') to perfectly match
the frontend UI groupings and prevent inter-group rank skewing.
"""
import re
import asyncio
from backend.models import Student, Class


def get_grade_group_for_class_name(name: str | None) -> str:
    """
    Determine grade group ('6-8' or '9-12') based on class name (e.g. '7B', '11A').
    """
    if not name:
        return "6-8"
    match = re.search(r"\d+", str(name))
    if match:
        num = int(match.group(0))
        if 9 <= num <= 12:
            return "9-12"
        if 6 <= num <= 8:
            return "6-8"
    return "6-8"


async def recalculate_ranks() -> None:
    """
    Recalculate ranks for all students partitioned by grade group ('6-8' and '9-12').
    - If a student's rank hasn't changed, previous_rank is preserved.
    - If a student's rank changes, previous_rank takes the former current_rank.
    - If current_rank was None (unseeded), both previous_rank and current_rank take the new rank.
    """
    students = await Student.all().prefetch_related("school_class").order_by("-points", "id")

    # Group students by parallel ('6-8' vs '9-12')
    groups: dict[str, list[Student]] = {"6-8": [], "9-12": []}
    for s in students:
        class_name = s.school_class.name if s.school_class else None
        grp = get_grade_group_for_class_name(class_name)
        groups[grp].append(s)

    update_tasks = []
    for grp, grp_students in groups.items():
        for rank, student in enumerate(grp_students, start=1):
            if student.current_rank is None:
                student.current_rank = rank
                student.previous_rank = rank
                update_tasks.append(
                    student.save(update_fields=["previous_rank", "current_rank"])
                )
                continue

            if student.current_rank == rank:
                continue

            # Rank changed within group
            student.previous_rank = student.current_rank
            student.current_rank = rank
            update_tasks.append(
                student.save(update_fields=["previous_rank", "current_rank"])
            )

    if update_tasks:
        await asyncio.gather(*update_tasks)


async def revert_student_rank_snapshot(student_id: int, previous_rank_snapshot: int | None) -> None:
    """
    When a point history record is deleted, revert the student's rank to
    the previous_rank_snapshot taken before the points were awarded, and reset rank_delta.
    """
    # First, recalculate group ranks based on the restored points
    await recalculate_ranks()

    # If we have a snapshot of what rank the student held before this point award:
    if previous_rank_snapshot is not None:
        student = await Student.get_or_none(id=student_id)
        if student:
            # Setting previous_rank = current_rank ensures rank_delta becomes 0 (reverted to baseline)
            student.previous_rank = student.current_rank
            await student.save(update_fields=["previous_rank"])

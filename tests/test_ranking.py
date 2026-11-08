import pytest

from backend.models import Class, Student
from backend.utils.ranking_helper import get_grade_group_for_class_name, recalculate_ranks


@pytest.mark.parametrize(
    ("name", "group"),
    [("6А", "6-8"), ("8Б", "6-8"), ("9A", "9-12"), ("11Б", "9-12"), ("12", "9-12"), (None, "6-8"), ("x", "6-8")],
)
def test_grade_group(name, group):
    assert get_grade_group_for_class_name(name) == group


async def _student(username, cls, points):
    return await Student.create(username=username, password="p", first_name=username, school_class=cls, points=points)


async def test_ranks_are_partitioned_by_grade_group(db):
    c7 = await Class.create(name="7А")
    c10 = await Class.create(name="10А")
    a = await _student("a", c7, 120)
    b = await _student("b", c7, 90)
    c = await _student("c", c10, 50)

    await recalculate_ranks()

    for s in (a, b, c):
        await s.refresh_from_db()
    assert (a.current_rank, b.current_rank, c.current_rank) == (1, 2, 1)


async def test_rank_change_keeps_previous_rank(db):
    c7 = await Class.create(name="7А")
    a = await _student("a", c7, 120)
    b = await _student("b", c7, 90)
    await recalculate_ranks()

    await b.refresh_from_db()
    b.points = 200
    await b.save(update_fields=["points"])
    await recalculate_ranks()
    await a.refresh_from_db()
    await b.refresh_from_db()
    assert (b.previous_rank, b.current_rank) == (2, 1)
    assert (a.previous_rank, a.current_rank) == (1, 2)

    # Recalculating without changes must not wipe the deltas.
    await recalculate_ranks()
    await b.refresh_from_db()
    assert (b.previous_rank, b.current_rank) == (2, 1)

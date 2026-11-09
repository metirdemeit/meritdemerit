from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from backend.models import Class, DisciplineRule, Student, SystemSetting, Teacher
from backend.routes.common import ScoringStatusPayload, read_scoring_status, update_scoring_status
from backend.routes.teachers import WorkflowAssignment, assign_points
from backend.utils.scoring import SCORING_KEY


async def _setup():
    cls = await Class.create(name="7А")
    student = await Student.create(username="stud", password="x", first_name="S", school_class=cls)
    teacher = await Teacher.create(username="teach", password="x", first_name="T")
    rule = await DisciplineRule.create(description="Помог", points=5)
    return student, teacher, rule


def _assignment(student, rule):
    return WorkflowAssignment(student_ids=[student.id], rule_ids=[rule.id], comment="ok")


async def test_open_by_default(db):
    status = await read_scoring_status()
    assert status["isOpen"] is True and status["deadline"] is None


async def test_admin_close_blocks_teacher(db):
    student, teacher, rule = await _setup()
    await update_scoring_status(ScoringStatusPayload(isOpen=False), current_admin=None)

    status = await read_scoring_status()
    assert status["isOpen"] is False and status["closedReason"] == "manual"

    before = student.points
    with pytest.raises(HTTPException) as exc:
        await assign_points(_assignment(student, rule), teacher=teacher)
    assert exc.value.status_code == 403
    await student.refresh_from_db()
    assert student.points == before


async def test_reopen_allows_teacher(db):
    student, teacher, rule = await _setup()
    await update_scoring_status(ScoringStatusPayload(isOpen=False), current_admin=None)
    await update_scoring_status(ScoringStatusPayload(isOpen=True), current_admin=None)

    before = student.points
    await assign_points(_assignment(student, rule), teacher=teacher)
    await student.refresh_from_db()
    assert student.points == before + 5


async def test_future_deadline_allows_then_expired_deadline_blocks(db):
    student, teacher, rule = await _setup()
    future = datetime.now(timezone.utc) + timedelta(hours=1)
    status = await update_scoring_status(ScoringStatusPayload(isOpen=True, deadline=future), current_admin=None)
    assert status["isOpen"] is True and status["deadline"]

    await assign_points(_assignment(student, rule), teacher=teacher)

    # Simulate the deadline passing.
    setting = await SystemSetting.get(key=SCORING_KEY)
    setting.value = {**setting.value, "deadline": (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()}
    await setting.save()

    status = await read_scoring_status()
    assert status["isOpen"] is False and status["closedReason"] == "timer_expired"
    with pytest.raises(HTTPException) as exc:
        await assign_points(_assignment(student, rule), teacher=teacher)
    assert exc.value.status_code == 403


async def test_past_deadline_rejected(db):
    past = datetime.now(timezone.utc) - timedelta(minutes=5)
    with pytest.raises(HTTPException) as exc:
        await update_scoring_status(ScoringStatusPayload(isOpen=True, deadline=past), current_admin=None)
    assert exc.value.status_code == 400

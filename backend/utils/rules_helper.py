from datetime import datetime, date, timedelta, timezone
from fastapi import HTTPException, status
from backend.models import Student, DisciplineRule, LimitMD, PointHistory, AdminPointHistory, Intervention


def get_start_of_period(limit: LimitMD) -> datetime | None:
    """Calculate the datetime boundary for checking usage limits."""
    now = datetime.now(timezone.utc)
    if limit.reset_type == "until_date" and limit.reset_date:
        # If reset_date is specified, count from start of time up to end of reset_date
        return None

    period = limit.reset_period or "weekly"
    if period == "daily":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "weekly":
        # Monday of current week at 00:00 UTC
        start_of_week = now - timedelta(days=now.weekday())
        return start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "monthly":
        return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    elif period == "none":
        return None
    return None


async def check_rule_limits_and_permissions(
    students: list[Student],
    rules: list[DisciplineRule],
    is_teacher: bool = True,
):
    """
    1. Check if teacher has access to all rules.
    2. Check limit_md for each (student, rule) combination.
    Raises HTTPException on violations.
    """
    for rule in rules:
        # Permission check
        if is_teacher and rule.access_level == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Учителям запрещено выставлять правило '{rule.description}' (требуются права администратора).",
            )

        # Limit check
        limit = await LimitMD.get_or_none(rule_id=rule.id)
        if not limit or limit.max_uses <= 0:
            continue

        # If reset_type is 'until_date' and current date is past reset_date, limit is expired
        if limit.reset_type == "until_date" and limit.reset_date:
            if date.today() > limit.reset_date:
                continue

        start_time = get_start_of_period(limit)

        for student in students:
            # Query history for count
            q1 = PointHistory.filter(student_id=student.id, rule_id=rule.id)
            q2 = AdminPointHistory.filter(student_id=student.id, rule_id=rule.id)
            if start_time:
                q1 = q1.filter(created_at__gte=start_time)
                q2 = q2.filter(created_at__gte=start_time)

            count1 = await q1.count()
            count2 = await q2.count()
            total_count = count1 + count2

            if total_count >= limit.max_uses:
                period_str = (
                    f"период ({limit.reset_period})"
                    if limit.reset_type == "period"
                    else f"до {limit.reset_date}"
                )
                student_name = f"{student.first_name} {student.last_name or ''}".strip()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Студент {student_name} достиг лимита для правила '{rule.description}' "
                        f"(максимум {limit.max_uses} раз за {period_str})."
                    ),
                )


async def auto_trigger_interventions(students: list[Student]):
    """Automatically create intervention records if student points drop into risk zones."""
    for student in students:
        pts = student.points
        if pts > 50:
            continue

        level = None
        if 41 <= pts <= 50:
            level = "warning"
        elif 31 <= pts <= 40:
            level = "homeroom"
        elif pts <= 30:
            level = "counselor"

        if level:
            # Check if pending intervention already exists for this level
            exists = await Intervention.filter(
                student_id=student.id, level=level, status="pending"
            ).exists()
            if not exists:
                await Intervention.create(
                    student_id=student.id,
                    level=level,
                    status="pending",
                    parent_notified=False,
                    notes=f"Автоматически сформировано при снижении баллов до {pts}",
                )

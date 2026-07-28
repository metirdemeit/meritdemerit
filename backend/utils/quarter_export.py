import io
import csv
import zipfile
from datetime import datetime, timezone

from backend.models import AdminPointHistory, PointHistory, Student


def _rows_to_csv_bytes(rows: list[list[str]]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerows(rows)
    # UTF-8 with BOM for Excel on Windows
    return buf.getvalue().encode("utf-8-sig")


async def load_quarter_export_rows() -> tuple[list[list[str]], list[list[str]]]:
    ph = await PointHistory.all().prefetch_related("student", "student__school_class", "teacher", "rule")
    aph = await AdminPointHistory.all().prefetch_related("student", "student__school_class", "rule", "admin")
    students = await Student.all().prefetch_related("school_class").order_by(
        "school_class_id", "last_name", "first_name", "id"
    )

    history_header = [
        "created_at",
        "source",
        "actor_id",
        "actor_username",
        "actor_first_name",
        "actor_last_name",
        "student_id",
        "student_username",
        "student_first_name",
        "student_last_name",
        "class_id",
        "class_name",
        "rule_id",
        "rule_description",
        "points_changed",
        "comment",
    ]
    history_rows: list[list[str]] = [history_header]

    for r in ph:
        sc = r.student.school_class if hasattr(r.student, "school_class") else None
        history_rows.append(
            [
                r.created_at.isoformat() if r.created_at else "",
                "teacher",
                str(r.teacher_id or ""),
                getattr(r.teacher, "username", "") if r.teacher else "",
                getattr(r.teacher, "first_name", "") if r.teacher else "",
                getattr(r.teacher, "last_name", "") if r.teacher else "",
                str(r.student_id or ""),
                getattr(r.student, "username", "") if r.student else "",
                getattr(r.student, "first_name", "") if r.student else "",
                getattr(r.student, "last_name", "") if r.student else "",
                str(getattr(sc, "id", "") or ""),
                str(getattr(sc, "name", "") or ""),
                str(r.rule_id or ""),
                getattr(r.rule, "description", "") if r.rule else "",
                str(r.points_changed),
                r.comment or "",
            ]
        )

    for r in aph:
        sc = r.student.school_class if hasattr(r.student, "school_class") else None
        history_rows.append(
            [
                r.created_at.isoformat() if r.created_at else "",
                "admin",
                str(r.admin_id or ""),
                getattr(r.admin, "username", "") if r.admin else "",
                getattr(r.admin, "first_name", "") if r.admin else "",
                getattr(r.admin, "last_name", "") if r.admin else "",
                str(r.student_id or ""),
                getattr(r.student, "username", "") if r.student else "",
                getattr(r.student, "first_name", "") if r.student else "",
                getattr(r.student, "last_name", "") if r.student else "",
                str(getattr(sc, "id", "") or ""),
                str(getattr(sc, "name", "") or ""),
                str(r.rule_id or ""),
                getattr(r.rule, "description", "") if r.rule else "",
                str(r.points_changed),
                r.comment or "",
            ]
        )

    students_header = [
        "student_id",
        "username",
        "first_name",
        "last_name",
        "telegram_id",
        "class_id",
        "class_name",
        "points",
    ]
    students_rows: list[list[str]] = [students_header]
    for s in students:
        sc = s.school_class
        students_rows.append(
            [
                str(s.id),
                s.username or "",
                s.first_name or "",
                s.last_name or "",
                str(s.telegram_id or ""),
                str(getattr(sc, "id", "") or ""),
                str(getattr(sc, "name", "") or ""),
                str(s.points),
            ]
        )

    return history_rows, students_rows


async def build_quarter_export_zip_bytes() -> tuple[bytes, str]:
    history_rows, students_rows = await load_quarter_export_rows()
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("history.csv", _rows_to_csv_bytes(history_rows))
        zf.writestr("students.csv", _rows_to_csv_bytes(students_rows))
    name = f"quarter_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.zip"
    return buf.getvalue(), name


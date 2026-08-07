from typing import List, Optional, Literal
import csv
import io
import zipfile
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
import anyio
from pydantic import BaseModel
from tortoise.contrib.pydantic import pydantic_model_creator
from tortoise.exceptions import DoesNotExist, IntegrityError
from tortoise.functions import Avg, Count
from tortoise.expressions import Q
from datetime import datetime, timedelta, timezone

from backend.models import DisciplineRule, Teacher, Student, PointHistory, Admin, Class, AdminPointHistory
from backend.utils.security import get_current_admin, enforce_https
from backend.utils.google_sheets import get_sheets_service, ensure_sheet, write_values
from backend.utils.quarter_export import build_quarter_export_zip_bytes, load_quarter_export_rows
from tortoise.transactions import in_transaction
from tortoise import Tortoise

router = APIRouter(dependencies=[Depends(get_current_admin), Depends(enforce_https)])

# --- Pydantic Models ---

# Rules
RuleIn_Pydantic = pydantic_model_creator(
    DisciplineRule, name="RuleIn", exclude_readonly=True
)
RuleOut_Pydantic = pydantic_model_creator(
    DisciplineRule, name="RuleOut"
)

class RuleUpdate(BaseModel):
    description: str | None = None
    points: int | None = None
    type: Literal["merit", "demerit"] | None = None

class RuleCreate(BaseModel):
    description: str
    points: int
    type: Literal["merit", "demerit"] = "merit"

# Teachers
Teacher_Pydantic = pydantic_model_creator(Teacher, name="TeacherOut")
TeacherIn_Pydantic = pydantic_model_creator(
    Teacher, name="TeacherIn", exclude=("id", "telegram_id", "password")
)

class TeacherCreate(TeacherIn_Pydantic):
    username: str
    first_name: str
    last_name: str | None = None
    password: str

class TeacherUpdate(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    password: str | None = None

# Students
Student_Pydantic = pydantic_model_creator(Student, name="StudentOut")
StudentIn_Pydantic = pydantic_model_creator(
    Student, name="StudentIn", exclude=("id", "telegram_id",)
)

class StudentCreate(StudentIn_Pydantic):
    username: str
    first_name: str
    last_name: str | None = None
    password: str
    class_name: str 

class StudentUpdate(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    password: str | None = None
    class_name: str | None = None  

# Classes
Class_Pydantic = pydantic_model_creator(Class, name="ClassOut")
ClassIn_Pydantic = pydantic_model_creator(
    Class, name="ClassIn", exclude=("id",)
)

class ClassCreate(ClassIn_Pydantic):
    name: str

class ClassUpdate(BaseModel):
    name: str | None = None

# Dashboard & Analytics
class DashboardStats(BaseModel):
    total_students: int
    active_students: int
    total_teachers: int
    active_teachers: int
    sum_positive_points: int
    sum_negative_points: int
    total_assignments: int

class PointHistoryResponse(BaseModel):
    id: int
    student_name: str
    student_class: str
    teacher_name: str
    rule_description: str
    points_changed: int
    comment: str
    created_at: datetime


class HistoryPaginationResponse(BaseModel):
    items: List[PointHistoryResponse]
    total_count: int
    page: int
    size: int
    total_pages: int


class ExportQuarterToSheetsRequest(BaseModel):
    spreadsheet_id: str
    history_sheet_title: str | None = None
    students_sheet_title: str | None = None


class ExportQuarterToSheetsResponse(BaseModel):
    spreadsheet_id: str
    history_sheet_title: str
    students_sheet_title: str
    history_rows_written: int
    students_rows_written: int


class TeacherStats(BaseModel):
    teacher_id: int
    first_name: str
    last_name: str | None
    positive_assignments: int
    negative_assignments: int
    total_students_affected: int

class StudentWithClassResponse(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str | None
    points: int
    school_class: dict | None = None
    
    @classmethod
    async def from_student(cls, student: Student):
        school_class_data = None
        if student.school_class:
            school_class_data = {
                "id": student.school_class.id,
                "name": student.school_class.name
            }
        return cls(
            id=student.id,
            username=student.username,
            first_name=student.first_name,
            last_name=student.last_name,
            points=student.points,
            school_class=school_class_data
        )


class AdminRankingPaginationResponse(BaseModel):
    items: List[StudentWithClassResponse]
    total_count: int
    page: int
    size: int
    total_pages: int


class AdminStudentProfile(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str | None
    telegram_id: int | None
    points: int
    school_class: dict | None = None
    rank: int
    total_assignments: int

# Assignment models
class AdminAssignment(BaseModel):
    student_ids: List[int]
    rule_ids: List[int]
    comment: str

class AdminSingleAssignment(BaseModel):
    rule_ids: List[int]
    comment: str

# --- Student profile for admin ---

@router.get("/students/{student_id}/profile", response_model=AdminStudentProfile, summary="Get student profile for admin")
async def get_student_profile_for_admin(student_id: int):
    student = await Student.get_or_none(id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    await student.fetch_related("school_class")
    school_class_data = None
    if student.school_class:
        school_class_data = {
            "id": student.school_class.id,
            "name": student.school_class.name
        }

    students_with_more_points = await Student.filter(points__gt=student.points).count()
    global_rank = students_with_more_points + 1
    total_teacher_assignments = await PointHistory.filter(student_id=student_id).count()
    total_admin_assignments = await AdminPointHistory.filter(student_id=student_id).count()

    return AdminStudentProfile(
        id=student.id,
        username=student.username,
        first_name=student.first_name,
        last_name=student.last_name,
        telegram_id=student.telegram_id,
        points=student.points,
        school_class=school_class_data,
        rank=global_rank,
        total_assignments=total_teacher_assignments + total_admin_assignments,
    )


@router.get("/students/{student_id}/history", response_model=HistoryPaginationResponse, summary="Get student history for admin")
async def get_student_history_for_admin(
    student_id: int,
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Number of items per page"),
):
    student = await Student.get_or_none(id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    ph = await PointHistory.filter(student_id=student_id).prefetch_related("student", "student__school_class", "teacher", "rule")
    aph = await AdminPointHistory.filter(student_id=student_id).prefetch_related("student", "student__school_class", "rule", "admin")
    all_items = _build_combined_history(ph, aph)

    return HistoryPaginationResponse(
        items=_slice(all_items, page, size),
        total_count=len(all_items),
        page=page,
        size=size,
        total_pages=(len(all_items) + size - 1) // size,
    )


# --- Dashboard & Analytics ---

@router.get("/dashboard", response_model=DashboardStats, summary="Get admin dashboard analytics")
async def get_admin_dashboard():

    total_students = await Student.all().count()
    total_teachers = await Teacher.all().count()
    active_students = await Student.filter(telegram_id__isnull=False).count()
    active_teachers = await Teacher.filter(telegram_id__isnull=False).count()
    all_history = await PointHistory.all()
    sum_positive_points = sum(h.points_changed for h in all_history if h.points_changed > 0)
    sum_negative_points = abs(sum(h.points_changed for h in all_history if h.points_changed < 0))
    total_assignments = len(all_history)
    
    return DashboardStats(
        total_students=total_students,
        active_students=active_students,
        total_teachers=total_teachers,
        active_teachers=active_teachers,
        sum_positive_points=sum_positive_points,
        sum_negative_points=sum_negative_points,
        total_assignments=total_assignments
    )

# --- Students CRUD ---

@router.post("/students", response_model=Student_Pydantic, status_code=status.HTTP_201_CREATED, summary="Create student")
async def create_student(student_data: StudentCreate):
    """
    Create a new student. If class doesn't exist, it will be created automatically.
    """
    try:
    
        school_class, created = await Class.get_or_create(
            name=student_data.class_name,
            defaults={"name": student_data.class_name}
        )
        
        student = await Student.create(
            username=student_data.username,
            first_name=student_data.first_name,
            last_name=student_data.last_name,
            password=student_data.password,
            school_class_id=school_class.id
        )
        return await Student_Pydantic.from_tortoise_orm(student)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

@router.get("/students", response_model=List[StudentWithClassResponse], summary="Get all students")
async def get_all_students():
    students = await Student.all().prefetch_related("school_class")
    return [await StudentWithClassResponse.from_student(student) for student in students]


@router.get("/students/{student_id}", response_model=StudentWithClassResponse, summary="Get student by ID")
async def get_student(student_id: int):
    student = await Student.get_or_none(id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    await student.fetch_related("school_class")
    return await StudentWithClassResponse.from_student(student)

@router.put("/students/{student_id}", response_model=Student_Pydantic, summary="Update student")
async def update_student(student_id: int, student_data: StudentUpdate):
    student = await Student.get_or_none(id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student_data.dict(exclude_unset=True)
    
    # Handle class_name separately
    if "class_name" in update_data:
        class_name = update_data.pop("class_name")
        if class_name and class_name.strip():
            school_class, created = await Class.get_or_create(
                name=class_name.strip(),
                defaults={"name": class_name.strip()}
            )
            update_data["school_class_id"] = school_class.id
    
    await student.update_from_dict(update_data)
    await student.save()
    return await Student_Pydantic.from_tortoise_orm(student)

@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete student")
async def delete_student(student_id: int):
    student = await Student.get_or_none(id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await student.delete()
    return None

# --- Teachers CRUD ---

@router.post("/teachers", response_model=Teacher_Pydantic, status_code=status.HTTP_201_CREATED, summary="Create teacher")
async def create_teacher(teacher_data: TeacherCreate):
    try:
        teacher = await Teacher.create(
            username=teacher_data.username,
            first_name=teacher_data.first_name,
            last_name=teacher_data.last_name,
            password=teacher_data.password,
        )
        return await Teacher_Pydantic.from_tortoise_orm(teacher)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

@router.get("/teachers", response_model=List[Teacher_Pydantic], summary="Get all teachers")
async def get_all_teachers():
    teachers = Teacher.all()
    return await Teacher_Pydantic.from_queryset(teachers)

@router.get("/teachers/{teacher_id}", response_model=Teacher_Pydantic, summary="Get teacher by ID")
async def get_teacher(teacher_id: int):
    """
    Get a specific teacher by ID.
    """
    teacher = await Teacher.get_or_none(id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return await Teacher_Pydantic.from_tortoise_orm(teacher)

@router.put("/teachers/{teacher_id}", response_model=Teacher_Pydantic, summary="Update teacher")
async def update_teacher(teacher_id: int, teacher_data: TeacherUpdate):
    """
    Update a teacher.
    """
    teacher = await Teacher.get_or_none(id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    update_data = teacher_data.dict(exclude_unset=True)
    await teacher.update_from_dict(update_data)
    await teacher.save()
    return await Teacher_Pydantic.from_tortoise_orm(teacher)

@router.delete("/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete teacher")
async def delete_teacher(teacher_id: int):
    """
    Delete a teacher.
    """
    teacher = await Teacher.get_or_none(id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    await teacher.delete()
    return None

# --- Rules CRUD ---

@router.post("/rules", response_model=RuleOut_Pydantic, status_code=status.HTTP_201_CREATED, summary="Create rule")
async def create_rule(rule_data: RuleCreate):
    """
    Create a new discipline rule.
    """
    rule = await DisciplineRule.create(**rule_data.dict())
    return await RuleOut_Pydantic.from_tortoise_orm(rule)

@router.get("/rules", response_model=List[RuleOut_Pydantic], summary="Get all rules")
async def get_all_rules():
    """
    Get all discipline rules.
    """
    rules = DisciplineRule.all()
    return await RuleOut_Pydantic.from_queryset(rules)

@router.get("/rules/{rule_id}", response_model=RuleOut_Pydantic, summary="Get rule by ID")
async def get_rule(rule_id: int):
    """
    Get a specific rule by ID.
    """
    rule = await DisciplineRule.get_or_none(id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return await RuleOut_Pydantic.from_tortoise_orm(rule)

@router.put("/rules/{rule_id}", response_model=RuleOut_Pydantic, summary="Update rule")
async def update_rule(rule_id: int, rule_details: RuleUpdate):
    """
    Update a discipline rule.
    """
    rule = await DisciplineRule.get_or_none(id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = rule_details.dict(exclude_unset=True)
    await rule.update_from_dict(update_data)
    await rule.save()
    return await RuleOut_Pydantic.from_tortoise_orm(rule)

@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete rule")
async def delete_rule(rule_id: int):
    """
    Delete a discipline rule.
    """
    rule = await DisciplineRule.get_or_none(id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    await rule.delete()
    return None

# --- Search ---

@router.get("/search", response_model=List[Teacher_Pydantic], summary="Search teachers by name")
async def search_teachers(q: str = Query(..., min_length=1)):
    """
    Search for teachers by first or last name.
    """
    teachers = await Teacher.filter(
        Q(first_name__icontains=q) | Q(last_name__icontains=q)
    )
    return await Teacher_Pydantic.from_queryset(teachers)


# --- Assignment ---

@router.post("/assign", status_code=status.HTTP_201_CREATED, summary="Assign points to multiple students (admin)")
async def admin_assign_points(assignment: AdminAssignment, current_admin: Admin = Depends(get_current_admin)):
    """
    Assign points to multiple students (admin can assign without teacher context).
    """
    if not assignment.student_ids or not assignment.rule_ids:
        raise HTTPException(status_code=400, detail="Student and rule IDs cannot be empty.")

    async with in_transaction():
        rules = await DisciplineRule.filter(id__in=assignment.rule_ids)
        if len(rules) != len(assignment.rule_ids):
            raise HTTPException(status_code=404, detail="One or more rules not found")

        students_to_update = await Student.filter(id__in=assignment.student_ids)
        if len(students_to_update) != len(assignment.student_ids):
            raise HTTPException(status_code=404, detail="One or more students not found")

        history_records: list[AdminPointHistory] = []
        total_points_map = {student.id: 0 for student in students_to_update}

        for rule in rules:
            for student in students_to_update:
                total_points_map[student.id] += rule.points
                history_records.append(
                    AdminPointHistory(
                        student_id=student.id,
                        admin_id=current_admin.id,
                        rule_id=rule.id,
                        points_changed=rule.points,
                        comment=assignment.comment
                    )
                )

        # Update student points
        for student in students_to_update:
            student.points += total_points_map[student.id]
            await student.save(update_fields=["points"])

        # Bulk create history records
        await AdminPointHistory.bulk_create(history_records)

    return {
        "message": f"Points assigned successfully to {len(students_to_update)} students using {len(rules)} rules.",
        "students_affected": len(students_to_update),
        "rules_used": len(rules),
        "total_points": sum(total_points_map.values())
    }

# --- History helpers ---

def _get_student_class_name(record) -> str:
    if hasattr(record.student, "school_class") and record.student.school_class:
        return record.student.school_class.name
    return "Без класса"


def _build_combined_history(
    teacher_records, admin_records
) -> list[PointHistoryResponse]:
    combined: list[tuple[datetime, PointHistoryResponse]] = []

    for r in teacher_records:
        combined.append((r.created_at, PointHistoryResponse(
            id=r.id,
            student_name=f"{r.student.first_name} {r.student.last_name}",
            student_class=_get_student_class_name(r),
            teacher_name=f"{r.teacher.first_name} {r.teacher.last_name}" if r.teacher else "Admin",
            rule_description=r.rule.description,
            points_changed=r.points_changed,
            comment=r.comment,
            created_at=r.created_at,
        )))

    for r in admin_records:
        combined.append((r.created_at, PointHistoryResponse(
            id=r.id,
            student_name=f"{r.student.first_name} {r.student.last_name}",
            student_class=_get_student_class_name(r),
            teacher_name="Admin",
            rule_description=r.rule.description,
            points_changed=r.points_changed,
            comment=r.comment,
            created_at=r.created_at,
        )))

    combined.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in combined]


def _slice(items: list[PointHistoryResponse], page: int, size: int) -> list[PointHistoryResponse]:
    offset = (page - 1) * size
    return items[offset : offset + size]

# --- History ---

@router.get("/history", response_model=HistoryPaginationResponse, summary="Get all point history")
async def get_all_history(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100), # По умолчанию 50
):
    # 1. Считаем общее количество записей
    count_ph = await PointHistory.all().count()
    count_aph = await AdminPointHistory.all().count()
    total_count = count_ph + count_aph

    # 2. Получаем данные (в идеале тут нужен UNION, но сохраним вашу логику слияния для простоты)
    # Но ограничим выборку, чтобы не грузить гигабайты данных
    ph = await PointHistory.all().prefetch_related("student", "student__school_class", "teacher", "rule")
    aph = await AdminPointHistory.all().prefetch_related("student", "student__school_class", "rule", "admin")
    
    all_items = _build_combined_history(ph, aph)
    
    # 3. Нарезаем
    start = (page - 1) * size
    end = start + size
    sliced_items = all_items[start:end]

    return HistoryPaginationResponse(
        items=sliced_items,
        total_count=total_count,
        page=page,
        size=size,
        total_pages=(total_count + size - 1) // size
    )

@router.get("/history/{history_id}", response_model=PointHistoryResponse, summary="Get specific history record")
async def get_history_record(history_id: int):
    """
    Get specific point history record.
    """
    record = await PointHistory.get_or_none(id=history_id) \
        .prefetch_related("student", "teacher", "rule")
    
    if not record:
        admin_rec = await AdminPointHistory.get_or_none(id=history_id).prefetch_related("student", "rule", "admin")
        if not admin_rec:
            raise HTTPException(status_code=404, detail="History record not found")
        return PointHistoryResponse(
            id=admin_rec.id,
            student_name=f"{admin_rec.student.first_name} {admin_rec.student.last_name}",
            teacher_name="Admin",
            rule_description=admin_rec.rule.description,
            points_changed=admin_rec.points_changed,
            comment=admin_rec.comment,
            created_at=admin_rec.created_at
        )
    
    return PointHistoryResponse(
        id=record.id,
        student_name=f"{record.student.first_name} {record.student.last_name}",
        teacher_name=f"{record.teacher.first_name} {record.teacher.last_name}" if record.teacher else "Admin",
        rule_description=record.rule.description,
        points_changed=record.points_changed,
        comment=record.comment,
        created_at=record.created_at
    )

@router.get("/history/student/{student_id}", response_model=List[PointHistoryResponse], summary="Get student's history")
async def get_student_history(
    student_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    student = await Student.get_or_none(id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    ph = await PointHistory.filter(student_id=student_id).prefetch_related("student", "student__school_class", "teacher", "rule")
    aph = await AdminPointHistory.filter(student_id=student_id).prefetch_related("student", "student__school_class", "rule", "admin")
    all_items = _build_combined_history(ph, aph)
    return _slice(all_items, page, size)

@router.get("/history/teacher/{teacher_id}", response_model=List[PointHistoryResponse], summary="Get teacher's history")
async def get_teacher_history(
    teacher_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    teacher = await Teacher.get_or_none(id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    ph = await PointHistory.filter(teacher_id=teacher_id).prefetch_related("student", "student__school_class", "teacher", "rule")
    all_items = _build_combined_history(ph, [])
    return _slice(all_items, page, size)

@router.get("/history/rule/{rule_id}", response_model=List[PointHistoryResponse], summary="Get rule's history")
async def get_rule_history(
    rule_id: int,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    rule = await DisciplineRule.get_or_none(id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    ph = await PointHistory.filter(rule_id=rule_id).prefetch_related("student", "student__school_class", "teacher", "rule")
    aph = await AdminPointHistory.filter(rule_id=rule_id).prefetch_related("student", "student__school_class", "rule", "admin")
    all_items = _build_combined_history(ph, aph)
    return _slice(all_items, page, size)

@router.delete("/history/{history_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete history record")
async def delete_history_record(history_id: int):
    """
    Delete a history record and revert the points.
    """
    # Try teacher history first
    history_record = await PointHistory.get_or_none(id=history_id)
    if history_record:
        async with in_transaction():
            student = await Student.get(id=history_record.student_id)
            student.points -= history_record.points_changed
            await student.save(update_fields=["points"])
            await history_record.delete()
        return None

    # Then try admin history
    admin_history = await AdminPointHistory.get_or_none(id=history_id)
    if not admin_history:
        raise HTTPException(status_code=404, detail="History record not found")

    async with in_transaction():
        student = await Student.get(id=admin_history.student_id)
        student.points -= admin_history.points_changed
        await student.save(update_fields=["points"])
        await admin_history.delete()
    return None


@router.get(
    "/history/export/zip",
    summary="Download quarter data as ZIP (history.csv + students.csv)",
)
async def export_quarter_zip():
    """
    Скачать обычные таблицы: архив с двумя CSV (UTF-8 с BOM для Excel).
    """
    zip_bytes, name = await build_quarter_export_zip_bytes()
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{name}"'},
    )


@router.post(
    "/history/export/google-sheets",
    response_model=ExportQuarterToSheetsResponse,
    summary="Export quarter data to Google Sheets",
)
async def export_history_to_google_sheets(payload: ExportQuarterToSheetsRequest):
    """
    Export quarter data into a Google Spreadsheet:
    - Sheet 1: PointHistory + AdminPointHistory (combined)
    - Sheet 2: Students list with current points

    Requires server env:
    - GOOGLE_SERVICE_ACCOUNT_FILE
    """
    history_rows, students_rows = await load_quarter_export_rows()

    async def _write():
        service = get_sheets_service()
        history_title = ensure_sheet(service, payload.spreadsheet_id, payload.history_sheet_title or "History")
        students_title = ensure_sheet(service, payload.spreadsheet_id, payload.students_sheet_title or "Students")
        write_values(service, payload.spreadsheet_id, history_title, history_rows)
        write_values(service, payload.spreadsheet_id, students_title, students_rows)
        return history_title, students_title

    history_title, students_title = await anyio.to_thread.run_sync(_write)
    return ExportQuarterToSheetsResponse(
        spreadsheet_id=payload.spreadsheet_id,
        history_sheet_title=history_title,
        students_sheet_title=students_title,
        history_rows_written=len(history_rows),
        students_rows_written=len(students_rows),
    )


@router.delete(
    "/history/purge",
    summary="Delete all point history for new quarter",
)
async def purge_point_history():
    """
    Delete PointHistory and AdminPointHistory (history only).
    Does NOT modify Student.points.
    """
    deleted_ph = await PointHistory.all().delete()
    deleted_aph = await AdminPointHistory.all().delete()
    return {"deleted_point_history": deleted_ph, "deleted_admin_point_history": deleted_aph}

# --- Statistics ---

@router.get("/stats/teachers", response_model=List[TeacherStats], summary="Get teachers statistics")
async def get_teachers_stats():
    """
    Get statistics for all teachers.
    """
    teachers = await Teacher.all()
    stats = []
    
    for teacher in teachers:
        # Get teacher's point history
        history = await PointHistory.filter(teacher_id=teacher.id)
        
        positive_assignments = sum(1 for h in history if h.points_changed > 0)
        negative_assignments = sum(1 for h in history if h.points_changed < 0)
        total_students_affected = len(set(h.student_id for h in history))
        
        stats.append(TeacherStats(
                teacher_id=teacher.id,
                first_name=teacher.first_name,
                last_name=teacher.last_name,
            positive_assignments=positive_assignments,
            negative_assignments=negative_assignments,
            total_students_affected=total_students_affected
        ))
    
    return stats

# --- Ranking ---

@router.get("/ranking", response_model=AdminRankingPaginationResponse, summary="Get students ranking by points with pagination (admin)")
async def get_students_ranking_admin(
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
):
    """
    Get full students ranking by points (highest first) with pagination (admin).
    """
    offset = (page - 1) * size

    total_count = await Student.all().count()

    students = await Student.all().prefetch_related("school_class") \
        .order_by("-points", "id") \
        .offset(offset) \
        .limit(size)

    items = [await StudentWithClassResponse.from_student(student) for student in students]

    return AdminRankingPaginationResponse(
        items=items,
        total_count=total_count,
        page=page,
        size=size,
        total_pages=(total_count + size - 1) // size,
    )


@router.get("/workflow/classes", response_model=List[Class_Pydantic], summary="Get all classes for workflow (admin)")
async def admin_workflow_classes():
    """
    Get all classes for workflow (admin version).
    """
    classes = Class.all()
    return await Class_Pydantic.from_queryset(classes)

@router.get("/workflow/classes/{class_id}/students", response_model=List[StudentWithClassResponse], summary="Get students by class for workflow (admin)")
async def admin_workflow_class_students(class_id: int):
    """
    Get students from a specific class for workflow (admin version).
    """
    class_obj = await Class.get_or_none(id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = await Student.filter(school_class_id=class_id).prefetch_related("school_class")
    return [await StudentWithClassResponse.from_student(student) for student in students]

@router.get("/workflow/rules", response_model=List[dict], summary="Get all rules for workflow (admin)")
async def admin_workflow_rules():
    """
    Get all discipline rules for workflow (admin version).
    """
    rules = await DisciplineRule.all()
    return [
        {
            "id": rule.id,
            "description": rule.description,
            "points": rule.points
        }
        for rule in rules
    ]

@router.get("/workflow/rule/{rule_id}/classes", response_model=List[dict], summary="Get classes for specific rule (admin)")
async def admin_get_rule_classes(rule_id: int):
    """
    Get all classes that have students (for rule-first workflow, admin version).
    """
    rule = await DisciplineRule.get_or_none(id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    # Get all classes that have students
    classes = await Class.all().prefetch_related("students")
    classes_with_students = []
    
    for class_obj in classes:
        if class_obj.students:
            classes_with_students.append({
                "id": class_obj.id,
                "name": class_obj.name,
                "student_count": len(class_obj.students)
            })
    
    return classes_with_students

@router.get("/workflow/rule/{rule_id}/classes/{class_id}/students", response_model=List[StudentWithClassResponse], summary="Get students for rule and class (admin)")
async def admin_get_rule_class_students(rule_id: int, class_id: int):
    """
    Get students from a specific class for a specific rule (rule-first workflow, admin version).
    """
    rule = await DisciplineRule.get_or_none(id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    class_obj = await Class.get_or_none(id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = await Student.filter(school_class_id=class_id).prefetch_related("school_class")
    return [await StudentWithClassResponse.from_student(student) for student in students]

@router.post("/workflow/assign", status_code=status.HTTP_201_CREATED, summary="Assign points using workflow (admin)")
async def admin_workflow_assign_points(assignment: AdminAssignment, current_admin: Admin = Depends(get_current_admin)):
    """
    Assign points using the workflow system (admin version).
    """
    if not assignment.student_ids or not assignment.rule_ids:
        raise HTTPException(status_code=400, detail="Student and rule IDs cannot be empty.")

    async with in_transaction():
        rules = await DisciplineRule.filter(id__in=assignment.rule_ids)
        if len(rules) != len(assignment.rule_ids):
            raise HTTPException(status_code=404, detail="One or more rules not found")

        students_to_update = await Student.filter(id__in=assignment.student_ids)
        if len(students_to_update) != len(assignment.student_ids):
            raise HTTPException(status_code=404, detail="One or more students not found")

        history_records: list[AdminPointHistory] = []
        total_points_map = {student.id: 0 for student in students_to_update}

        for rule in rules:
            for student in students_to_update:
                total_points_map[student.id] += rule.points
                history_records.append(
                    AdminPointHistory(
                        student_id=student.id,
                        admin_id=current_admin.id,
                        rule_id=rule.id,
                        points_changed=rule.points,
                        comment=assignment.comment
                    )
                )

        # Update student points
        for student in students_to_update:
            student.points += total_points_map[student.id]
            await student.save(update_fields=["points"])

        # Bulk create history records
        await AdminPointHistory.bulk_create(history_records)

    return {
        "message": f"Points assigned successfully to {len(students_to_update)} students using {len(rules)} rules.",
        "students_affected": len(students_to_update),
        "rules_used": len(rules),
        "total_points": sum(total_points_map.values())
    }

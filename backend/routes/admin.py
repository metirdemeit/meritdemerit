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
from datetime import datetime, timedelta, timezone, date

from backend.models import (
    DisciplineRule, Teacher, Student, PointHistory, Admin, Class,
    AdminPointHistory, DetentionHistory, ExamWeek, LimitMD, Intervention
)
from backend.utils.rules_helper import check_rule_limits_and_permissions, auto_trigger_interventions
from backend.utils.security import get_current_admin, enforce_https
from backend.utils.google_sheets import get_sheets_service, ensure_sheet, write_values
from backend.utils.quarter_export import build_quarter_export_zip_bytes, load_quarter_export_rows
from tortoise.transactions import in_transaction
from tortoise import Tortoise

router = APIRouter(dependencies=[Depends(get_current_admin), Depends(enforce_https)])

# --- Pydantic Models ---

# Limits and Rules
class LimitMDIn(BaseModel):
    max_uses: int = 1
    reset_type: Literal["period", "until_date"] = "period"
    reset_period: Literal["daily", "weekly", "monthly", "none"] | None = "weekly"
    reset_date: date | None = None

class LimitMDOut(BaseModel):
    id: int
    rule_id: int
    max_uses: int
    reset_type: str
    reset_period: str | None
    reset_date: date | None

class RuleResponse(BaseModel):
    id: int
    description: str
    points: int
    type: str
    access_level: str
    limit: LimitMDOut | None = None

class RuleCreate(BaseModel):
    description: str
    points: int
    type: Literal["merit", "demerit"] = "merit"
    access_level: Literal["all", "teacher", "admin"] = "all"
    limit: LimitMDIn | None = None

class RuleUpdate(BaseModel):
    description: str | None = None
    points: int | None = None
    type: Literal["merit", "demerit"] | None = None
    access_level: Literal["all", "teacher", "admin"] | None = None
    limit: LimitMDIn | None = None

# Teachers
class TeacherOut(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str | None = None
    telegram_id: int | None = None
    homeroom_class_id: int | None = None
    homeroom_class_name: str | None = None

class TeacherCreate(BaseModel):
    username: str
    first_name: str
    last_name: str | None = None
    password: str
    homeroom_class_id: int | None = None

class TeacherUpdate(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    password: str | None = None
    homeroom_class_id: int | None = None

# Interventions
class InterventionCreate(BaseModel):
    student_id: int
    level: Literal["warning", "homeroom", "counselor"]
    status: Literal["pending", "resolved"] = "pending"
    parent_notified: bool = False
    notes: str | None = None

class InterventionUpdate(BaseModel):
    status: Literal["pending", "resolved"] | None = None
    parent_notified: bool | None = None
    notes: str | None = None

class InterventionOut(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_class: str
    student_points: int
    level: str
    status: str
    parent_notified: bool
    notes: str | None
    created_at: datetime
    updated_at: datetime


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
    class_name: str | None = None
    school_class: dict | None = None
    
    @classmethod
    async def from_student(cls, student: Student):
        school_class_data = None
        class_name_str = None
        if student.school_class:
            class_name_str = student.school_class.name
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
            class_name=class_name_str,
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
    teacher_history = await PointHistory.all()
    admin_history = await AdminPointHistory.all()

    pos_teacher = sum(h.points_changed for h in teacher_history if h.points_changed > 0)
    pos_admin = sum(h.points_changed for h in admin_history if h.points_changed > 0)
    neg_teacher = sum(h.points_changed for h in teacher_history if h.points_changed < 0)
    neg_admin = sum(h.points_changed for h in admin_history if h.points_changed < 0)

    sum_positive_points = pos_teacher + pos_admin
    sum_negative_points = abs(neg_teacher + neg_admin)
    total_assignments = len(teacher_history) + len(admin_history)
    
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

# --- Helpers ---

async def _build_teacher_out(teacher: Teacher) -> TeacherOut:
    await teacher.fetch_related("homeroom_class")
    return TeacherOut(
        id=teacher.id,
        username=teacher.username,
        first_name=teacher.first_name,
        last_name=teacher.last_name,
        telegram_id=teacher.telegram_id,
        homeroom_class_id=teacher.homeroom_class.id if teacher.homeroom_class else None,
        homeroom_class_name=teacher.homeroom_class.name if teacher.homeroom_class else None,
    )

async def _build_rule_out(rule: DisciplineRule) -> RuleResponse:
    limit = await LimitMD.get_or_none(rule_id=rule.id)
    limit_out = None
    if limit:
        limit_out = LimitMDOut(
            id=limit.id,
            rule_id=limit.rule_id,
            max_uses=limit.max_uses,
            reset_type=limit.reset_type,
            reset_period=limit.reset_period,
            reset_date=limit.reset_date,
        )
    return RuleResponse(
        id=rule.id,
        description=rule.description,
        points=rule.points,
        type=rule.type,
        access_level=rule.access_level,
        limit=limit_out,
    )

async def _build_intervention_out(item: Intervention) -> InterventionOut:
    await item.fetch_related("student", "student__school_class")
    return InterventionOut(
        id=item.id,
        student_id=item.student.id,
        student_name=f"{item.student.first_name} {item.student.last_name or ''}".strip(),
        student_class=item.student.school_class.name if item.student.school_class else "Без класса",
        student_points=item.student.points,
        level=item.level,
        status=item.status,
        parent_notified=item.parent_notified,
        notes=item.notes,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )

# --- Teachers CRUD ---

@router.post("/teachers", response_model=TeacherOut, status_code=status.HTTP_201_CREATED, summary="Create teacher")
async def create_teacher(teacher_data: TeacherCreate):
    try:
        teacher = await Teacher.create(
            username=teacher_data.username,
            first_name=teacher_data.first_name,
            last_name=teacher_data.last_name,
            password=teacher_data.password,
            homeroom_class_id=teacher_data.homeroom_class_id,
        )
        return await _build_teacher_out(teacher)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )

@router.get("/teachers", response_model=List[TeacherOut], summary="Get all teachers")
async def get_all_teachers():
    teachers = await Teacher.all().prefetch_related("homeroom_class")
    return [await _build_teacher_out(t) for t in teachers]

@router.get("/teachers/{teacher_id}", response_model=TeacherOut, summary="Get teacher by ID")
async def get_teacher(teacher_id: int):
    teacher = await Teacher.get_or_none(id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return await _build_teacher_out(teacher)

@router.put("/teachers/{teacher_id}", response_model=TeacherOut, summary="Update teacher")
async def update_teacher(teacher_id: int, teacher_data: TeacherUpdate):
    teacher = await Teacher.get_or_none(id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    update_data = teacher_data.model_dump(exclude_unset=True)
    await teacher.update_from_dict(update_data)
    await teacher.save()
    return await _build_teacher_out(teacher)

@router.delete("/teachers/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete teacher")
async def delete_teacher(teacher_id: int):
    teacher = await Teacher.get_or_none(id=teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    await teacher.delete()
    return None

# --- Rules CRUD ---

@router.post("/rules", response_model=RuleResponse, status_code=status.HTTP_201_CREATED, summary="Create rule")
async def create_rule(rule_data: RuleCreate):
    limit_data = rule_data.limit
    rule_dict = rule_data.model_dump(exclude={"limit"})
    rule = await DisciplineRule.create(**rule_dict)

    if limit_data:
        await LimitMD.create(
            rule_id=rule.id,
            max_uses=limit_data.max_uses,
            reset_type=limit_data.reset_type,
            reset_period=limit_data.reset_period,
            reset_date=limit_data.reset_date,
        )
    return await _build_rule_out(rule)

@router.get("/rules", response_model=List[RuleResponse], summary="Get all rules")
async def get_all_rules():
    rules = await DisciplineRule.all()
    return [await _build_rule_out(r) for r in rules]

@router.get("/rules/{rule_id}", response_model=RuleResponse, summary="Get rule by ID")
async def get_rule(rule_id: int):
    rule = await DisciplineRule.get_or_none(id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return await _build_rule_out(rule)

@router.put("/rules/{rule_id}", response_model=RuleResponse, summary="Update rule")
async def update_rule(rule_id: int, rule_details: RuleUpdate):
    rule = await DisciplineRule.get_or_none(id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    dump = rule_details.model_dump(exclude_unset=True)
    has_limit_key = "limit" in dump
    limit_data = dump.pop("limit", None)

    if dump:
        await rule.update_from_dict(dump)
        await rule.save()

    if has_limit_key:
        existing_limit = await LimitMD.get_or_none(rule_id=rule.id)
        if limit_data is None or (isinstance(limit_data, dict) and limit_data.get("max_uses", 0) <= 0):
            if existing_limit:
                await existing_limit.delete()
        elif isinstance(limit_data, dict):
            if existing_limit:
                await existing_limit.update_from_dict(limit_data)
                await existing_limit.save()
            else:
                await LimitMD.create(rule_id=rule.id, **limit_data)

    return await _build_rule_out(rule)

@router.delete("/rules/{rule_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete rule")
async def delete_rule(rule_id: int):
    rule = await DisciplineRule.get_or_none(id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    await rule.delete()
    return None

# --- Interventions CRUD ---

@router.get("/interventions", response_model=List[InterventionOut], summary="Get all interventions")
async def get_interventions():
    items = await Intervention.all().prefetch_related("student", "student__school_class").order_by("-created_at")
    return [await _build_intervention_out(item) for item in items]

@router.post("/interventions", response_model=InterventionOut, status_code=status.HTTP_201_CREATED, summary="Create intervention")
async def create_intervention(payload: InterventionCreate):
    student = await Student.get_or_none(id=payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    item = await Intervention.create(
        student_id=payload.student_id,
        level=payload.level,
        status=payload.status,
        parent_notified=payload.parent_notified,
        notes=payload.notes,
    )
    return await _build_intervention_out(item)

@router.patch("/interventions/{intervention_id}", response_model=InterventionOut, summary="Update intervention")
async def update_intervention(intervention_id: int, payload: InterventionUpdate):
    item = await Intervention.get_or_none(id=intervention_id)
    if not item:
        raise HTTPException(status_code=404, detail="Intervention not found")

    update_data = payload.model_dump(exclude_unset=True)
    if update_data:
        await item.update_from_dict(update_data)
        await item.save()

    return await _build_intervention_out(item)

@router.delete("/interventions/{intervention_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete intervention")
async def delete_intervention(intervention_id: int):
    item = await Intervention.get_or_none(id=intervention_id)
    if not item:
        raise HTTPException(status_code=404, detail="Intervention not found")
    await item.delete()
    return None

@router.get("/search", response_model=List[TeacherOut], summary="Search teachers by name")
async def search_teachers(q: str = Query(..., min_length=1)):
    """
    Search for teachers by first or last name.
    """
    teachers = await Teacher.filter(
        Q(first_name__icontains=q) | Q(last_name__icontains=q)
    ).prefetch_related("homeroom_class")
    return [await _build_teacher_out(t) for t in teachers]


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
    Assign points using the workflow system (admin version). Checks limits and auto-triggers interventions.
    """
    if not assignment.student_ids or not assignment.rule_ids:
        raise HTTPException(status_code=400, detail="Student and rule IDs cannot be empty.")

    rules = await DisciplineRule.filter(id__in=assignment.rule_ids)
    if len(rules) != len(assignment.rule_ids):
        raise HTTPException(status_code=404, detail="One or more rules not found")

    students_to_update = await Student.filter(id__in=assignment.student_ids)
    if len(students_to_update) != len(assignment.student_ids):
        raise HTTPException(status_code=404, detail="One or more students not found")

    # 1. Check limits
    await check_rule_limits_and_permissions(students_to_update, rules, is_teacher=False)

    async with in_transaction():
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

    # 2. Auto-trigger interventions if points dropped into risk zones
    await auto_trigger_interventions(students_to_update)

    return {
        "message": f"Points assigned successfully to {len(students_to_update)} students using {len(rules)} rules.",
        "students_affected": len(students_to_update),
        "rules_used": len(rules),
        "total_points": sum(total_points_map.values())
    }


# =============================================================================
# DETENTION HISTORY
# =============================================================================

# --- Pydantic schemas ---

class ExamWeekCreate(BaseModel):
    title: str
    start_date: date
    end_date: date

class ExamWeekOut(BaseModel):
    id: int
    title: str
    start_date: date
    end_date: date

    class Config:
        from_attributes = True


class DetentionCreate(BaseModel):
    student_id: int
    start_date: date
    end_date: date
    notes: str | None = None


class DetentionUpdate(BaseModel):
    status: str | None = None           # active | completed | deferred | cancelled
    notes: str | None = None
    probation_end_date: date | None = None


class DetentionOut(BaseModel):
    id: int
    student_id: int
    student_name: str           # from student.first_name + last_name
    class_name: str | None      # from student.school_class.name (FK, not denorm.)
    current_points: int         # from student.points at query time (not stored)
    start_date: date
    end_date: date
    status: str
    notes: str | None
    probation_end_date: date | None
    is_exam_bypass: bool
    exam_week_title: str | None
    assigned_by_name: str | None  # from assigned_by.first_name + last_name or "Admin"
    created_at: datetime


# --- Helper ---

def _check_exam_overlap(start: date, end: date, exam_weeks: list[ExamWeek]) -> ExamWeek | None:
    """Return the first ExamWeek that overlaps with the given date range."""
    for ew in exam_weeks:
        if start <= ew.end_date and end >= ew.start_date:
            return ew
    return None


async def _build_detention_out(d: DetentionHistory) -> DetentionOut:
    """Build DetentionOut from a prefetched DetentionHistory record."""
    student = d.student
    class_name = None
    if hasattr(student, "school_class") and student.school_class:
        class_name = student.school_class.name

    assigned_by_name = "Admin"
    if hasattr(d, "assigned_by") and d.assigned_by:
        t = d.assigned_by
        assigned_by_name = f"{t.first_name} {t.last_name or ''}".strip()

    return DetentionOut(
        id=d.id,
        student_id=student.id,
        student_name=f"{student.first_name} {student.last_name or ''}".strip(),
        class_name=class_name,
        current_points=student.points,   # always live from Student table
        start_date=d.start_date,
        end_date=d.end_date,
        status=d.status,
        notes=d.notes,
        probation_end_date=d.probation_end_date,
        is_exam_bypass=d.is_exam_bypass,
        exam_week_title=d.exam_week_title,
        assigned_by_name=assigned_by_name,
        created_at=d.created_at,
    )


_DETENTION_PREFETCH = ["student", "student__school_class", "assigned_by"]


# =============================================================================
# EXAM WEEKS endpoints
# =============================================================================

@router.get("/exam-weeks", response_model=List[ExamWeekOut], summary="List all exam weeks")
async def list_exam_weeks():
    """Get all exam week periods."""
    weeks = await ExamWeek.all().order_by("start_date")
    return [ExamWeekOut(
        id=w.id,
        title=w.title,
        start_date=w.start_date,
        end_date=w.end_date,
    ) for w in weeks]


@router.post("/exam-weeks", response_model=ExamWeekOut, status_code=status.HTTP_201_CREATED,
             summary="Create exam week")
async def create_exam_week(payload: ExamWeekCreate):
    """Create a new exam week period."""
    ew = await ExamWeek.create(
        title=payload.title,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    return ExamWeekOut(id=ew.id, title=ew.title, start_date=ew.start_date, end_date=ew.end_date)


@router.delete("/exam-weeks/{exam_week_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete exam week")
async def delete_exam_week(exam_week_id: int):
    """Delete an exam week period."""
    ew = await ExamWeek.get_or_none(id=exam_week_id)
    if not ew:
        raise HTTPException(status_code=404, detail="Exam week not found")
    await ew.delete()
    return None


# =============================================================================
# DETENTIONS endpoints
# =============================================================================

@router.get("/detentions", response_model=List[DetentionOut], summary="List all detentions")
async def list_detentions():
    """Get all detention records ordered newest first."""
    records = await DetentionHistory.all().prefetch_related(*_DETENTION_PREFETCH).order_by("-created_at")
    return [await _build_detention_out(d) for d in records]


@router.get("/detentions/student/{student_id}", response_model=List[DetentionOut],
            summary="Get detentions for a specific student")
async def list_student_detentions(student_id: int):
    """Get all detention records for a given student."""
    student = await Student.get_or_none(id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    records = await DetentionHistory.filter(student_id=student_id).prefetch_related(
        *_DETENTION_PREFETCH
    ).order_by("-created_at")
    return [await _build_detention_out(d) for d in records]


@router.post("/detentions", response_model=DetentionOut, status_code=status.HTTP_201_CREATED,
             summary="Create a detention record")
async def create_detention(
    payload: DetentionCreate,
    current_admin: Admin = Depends(get_current_admin),
):
    """
    Create a new detention record for a student.
    - Automatically checks active ExamWeek periods: if the dates overlap, status is set to
      'deferred' and exam_week_title is recorded.
    """
    student = await Student.get_or_none(id=payload.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Check exam week overlap
    exam_weeks = await ExamWeek.all()
    overlap = _check_exam_overlap(payload.start_date, payload.end_date, exam_weeks)

    det_status = "active"
    is_bypass = False
    exam_title = None
    if overlap:
        det_status = "deferred"
        is_bypass = True
        exam_title = overlap.title

    record = await DetentionHistory.create(
        student_id=payload.student_id,
        assigned_by=None,               # Admin created — no teacher FK
        start_date=payload.start_date,
        end_date=payload.end_date,
        notes=payload.notes,
        status=det_status,
        is_exam_bypass=is_bypass,
        exam_week_title=exam_title,
    )

    await record.fetch_related(*_DETENTION_PREFETCH)
    return await _build_detention_out(record)


@router.patch("/detentions/{detention_id}", response_model=DetentionOut,
              summary="Update detention status or notes")
async def update_detention(detention_id: int, payload: DetentionUpdate):
    """
    Update a detention record.
    - If status changes to 'completed', probation_end_date is automatically set to today + 14 days.
    """
    record = await DetentionHistory.get_or_none(id=detention_id)
    if not record:
        raise HTTPException(status_code=404, detail="Detention not found")

    update_data = payload.model_dump(exclude_unset=True)

    # Auto-set probation when marking completed
    if update_data.get("status") == "completed" and record.status != "completed":
        from datetime import date as _date
        update_data["probation_end_date"] = _date.today() + timedelta(days=14)

    await record.update_from_dict(update_data)
    await record.save()
    await record.fetch_related(*_DETENTION_PREFETCH)
    return await _build_detention_out(record)


@router.delete("/detentions/{detention_id}", status_code=status.HTTP_204_NO_CONTENT,
               summary="Delete a detention record")
async def delete_detention(detention_id: int):
    """Delete a detention record."""
    record = await DetentionHistory.get_or_none(id=detention_id)
    if not record:
        raise HTTPException(status_code=404, detail="Detention not found")
    await record.delete()
    return None

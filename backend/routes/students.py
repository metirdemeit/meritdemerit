from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from datetime import datetime

from backend.models import Student, PointHistory, AdminPointHistory
from backend.utils.security import get_current_user, enforce_https
from tortoise.contrib.pydantic import pydantic_model_creator

router = APIRouter(dependencies=[Depends(enforce_https)])

# --- Pydantic Models ---

class StudentProfile(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str | None
    points: int
    telegram_id: int | None
    school_class: dict | None = None
    rank: int

class StudentHistoryResponse(BaseModel):
    id: int
    teacher_name: str
    role: str
    rule_description: str
    points_changed: int
    comment: str
    created_at: datetime

class StudentHistoryDetail(BaseModel):
    id: int
    teacher_name: str
    role: str
    rule_description: str
    points_changed: int
    comment: str
    created_at: datetime

# --- Dependency to ensure user is a student ---

async def get_current_student(current_user: Student = Depends(get_current_user)) -> Student:
    if not isinstance(current_user, Student):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action.",
        )
    return current_user

# --- Student Profile ---

@router.get("/me", response_model=StudentProfile, summary="Get student profile")
async def get_student_profile(student: Student = Depends(get_current_student)):
    """
    Get current student's profile information.
    """
    # Load school class if exists
    await student.fetch_related("school_class")
    
    school_class_data = None
    if student.school_class:
        school_class_data = {
            "id": student.school_class.id,
            "name": student.school_class.name
        }
    
    # Calculate global rank
    students_with_more_points = await Student.filter(points__gt=student.points).count()
    global_rank = students_with_more_points + 1
    
    return StudentProfile(
        id=student.id,
        username=student.username,
        first_name=student.first_name,
        last_name=student.last_name,
        points=student.points,
        telegram_id=student.telegram_id,
        school_class=school_class_data,
        rank=global_rank
    )

# --- History ---

@router.get("/me/history", response_model=List[StudentHistoryResponse], summary="Get student's point history")
async def get_student_history(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    student: Student = Depends(get_current_student)
):
    teacher_history = await PointHistory.filter(student_id=student.id) \
        .prefetch_related("teacher", "rule") \
        .all()

    admin_history = await AdminPointHistory.filter(student_id=student.id) \
        .prefetch_related("admin", "rule") \
        .all()

    combined: list[dict] = []

    for record in teacher_history:
        teacher_name = "Удаленный учитель"
        if record.teacher:
            teacher_name = f"{record.teacher.first_name} {record.teacher.last_name or ''}".strip()
        rule_desc = record.rule.description if record.rule else "—"

        combined.append({
            "id": record.id,
            "teacher_name": teacher_name,
            "role": "teacher",
            "rule_description": rule_desc,
            "points_changed": record.points_changed,
            "comment": record.comment,
            "created_at": record.created_at,
        })

    for record in admin_history:
        admin_name = "Администратор"
        if record.admin:
            admin_name = f"{record.admin.first_name} {record.admin.last_name or ''}".strip()
        rule_desc = record.rule.description if record.rule else "—"

        combined.append({
            "id": record.id,
            "teacher_name": admin_name,
            "role": "admin",
            "rule_description": rule_desc,
            "points_changed": record.points_changed,
            "comment": record.comment,
            "created_at": record.created_at,
        })

    combined.sort(key=lambda x: x["created_at"], reverse=True)

    offset = (page - 1) * size
    return [StudentHistoryResponse(**r) for r in combined[offset : offset + size]]

@router.get("/me/history/{assignment_id}", response_model=StudentHistoryDetail, summary="Get specific assignment details")
async def get_assignment_detail(
    assignment_id: int,
    student: Student = Depends(get_current_student)
):
    """
    Get details of a specific point assignment for the student.
    Checks both teacher and admin history.
    """
    # Try to find in teacher history first
    record = await PointHistory.get_or_none(id=assignment_id)
    
    if record:
        await record.fetch_related("teacher", "rule")
        
        # Check if the assignment belongs to this student
        if record.student_id != student.id:
            raise HTTPException(status_code=403, detail="You can only view your own assignments")
        
        teacher_name = "Удаленный учитель"
        if record.teacher:
            teacher_name = f"{record.teacher.first_name} {record.teacher.last_name or ''}".strip()

        return StudentHistoryDetail(
            id=record.id,
            teacher_name=teacher_name,
            role="teacher",
            rule_description=record.rule.description if record.rule else "—",
            points_changed=record.points_changed,
            comment=record.comment,
            created_at=record.created_at
        )
    
    # If not found in teacher history, try admin history
    admin_record = await AdminPointHistory.get_or_none(id=assignment_id)
    
    if admin_record:
        await admin_record.fetch_related("admin", "rule")
        
        # Check if the assignment belongs to this student
        if admin_record.student_id != student.id:
            raise HTTPException(status_code=403, detail="You can only view your own assignments")
        
        admin_name = "Администратор"
        if admin_record.admin:
            admin_name = f"{admin_record.admin.first_name} {admin_record.admin.last_name or ''}".strip()

        return StudentHistoryDetail(
            id=admin_record.id,
            teacher_name=admin_name,
            role="admin",
            rule_description=admin_record.rule.description if admin_record.rule else "—",
            points_changed=admin_record.points_changed,
            comment=admin_record.comment,
            created_at=admin_record.created_at
        )
    
    # Not found in either table
    raise HTTPException(status_code=404, detail="Assignment not found")

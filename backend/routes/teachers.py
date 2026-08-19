from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from tortoise.transactions import in_transaction
from datetime import datetime

from backend.models import Teacher, Student, DisciplineRule, PointHistory, Class
from backend.utils.security import get_current_user, enforce_https
from backend.utils.rules_helper import check_rule_limits_and_permissions, auto_trigger_interventions
from tortoise.contrib.pydantic import pydantic_model_creator

router = APIRouter(dependencies=[Depends(enforce_https)])

# --- Pydantic Models ---

class WorkflowAssignment(BaseModel):
    student_ids: List[int]
    rule_ids: List[int]
    comment: str

class TeacherProfile(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str | None
    telegram_id: int | None
    homeroom_class_id: int | None = None
    homeroom_class_name: str | None = None

class TeacherHistoryResponse(BaseModel):
    id: int
    student_name: str
    student_class: str
    rule_description: str
    points_changed: int
    comment: str
    created_at: datetime

class TeacherHistoryDetail(BaseModel):
    id: int
    student_name: str
    student_class: str
    rule_description: str
    points_changed: int
    comment: str
    created_at: datetime
    can_delete: bool = True

class PaginatedTeacherHistory(BaseModel):
    items: List[TeacherHistoryResponse]
    total_count: int
    page: int
    size: int
    total_pages: int

# --- Dependency to ensure user is a teacher ---

async def get_current_teacher(current_user: Teacher = Depends(get_current_user)) -> Teacher:
    if not isinstance(current_user, Teacher):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to perform this action.",
        )
    return current_user

# --- Teacher Profile ---

@router.get("/me", response_model=TeacherProfile, summary="Get teacher profile")
async def get_teacher_profile(teacher: Teacher = Depends(get_current_teacher)):
    """
    Get current teacher's profile information with homeroom class.
    """
    await teacher.fetch_related("homeroom_class")
    class_id = teacher.homeroom_class.id if teacher.homeroom_class else None
    class_name = teacher.homeroom_class.name if teacher.homeroom_class else None

    return TeacherProfile(
        id=teacher.id,
        username=teacher.username,
        first_name=teacher.first_name,
        last_name=teacher.last_name,
        telegram_id=teacher.telegram_id,
        homeroom_class_id=class_id,
        homeroom_class_name=class_name,
    )

# --- Assignment ---

@router.post("/workflow/assign", status_code=status.HTTP_201_CREATED, summary="Assign points to students")
async def assign_points(assignment: WorkflowAssignment, teacher: Teacher = Depends(get_current_teacher)):
    """
    Assign points to students using rules. Checks access level and rule limits.
    """
    if not assignment.student_ids or not assignment.rule_ids:
        raise HTTPException(status_code=400, detail="Student and rule IDs cannot be empty.")

    if not assignment.comment or not assignment.comment.strip():
        raise HTTPException(status_code=400, detail="Комментарий обязателен при выставлении баллов.")

    # Validate rules exist
    rules = await DisciplineRule.filter(id__in=assignment.rule_ids)
    if len(rules) != len(assignment.rule_ids):
        raise HTTPException(status_code=404, detail="One or more rules not found")

    # Validate students exist
    students_to_update = await Student.filter(id__in=assignment.student_ids)
    if len(students_to_update) != len(assignment.student_ids):
        raise HTTPException(status_code=404, detail="One or more students not found")

    # 1. Check permissions and limits
    await check_rule_limits_and_permissions(students_to_update, rules, is_teacher=True)

    async with in_transaction():
        history_records = []
        total_points_map = {student.id: 0 for student in students_to_update}

        # Create history records and calculate total points
        for rule in rules:
            for student in students_to_update:
                total_points_map[student.id] += rule.points
                history_records.append(
                    PointHistory(
                        student_id=student.id,
                        teacher_id=teacher.id,
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
        await PointHistory.bulk_create(history_records)

    # 2. Auto-trigger interventions if points dropped into risk zones
    await auto_trigger_interventions(students_to_update)

    return {
        "message": f"Points assigned successfully to {len(students_to_update)} students using {len(rules)} rules.",
        "students_affected": len(students_to_update),
        "rules_used": len(rules),
        "total_points": sum(total_points_map.values())
    }

# --- History ---

@router.get("/me/history", response_model=PaginatedTeacherHistory, summary="Get teacher's point history")
async def get_teacher_history(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Number of items per page"),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get teacher's point assignment history with pagination.
    Returns history items and total count for pagination.
    """
    offset = (page - 1) * size
    
    # Get total count
    total_count = await PointHistory.filter(teacher_id=teacher.id).count()
    
    # Get paginated history
    history = await PointHistory.filter(teacher_id=teacher.id) \
        .prefetch_related("student", "student__school_class", "rule") \
        .order_by("-created_at") \
        .offset(offset) \
        .limit(size)
    
    items = [
        TeacherHistoryResponse(
            id=record.id,
            student_name=f"{record.student.first_name} {record.student.last_name}",
            student_class=record.student.school_class.name if record.student.school_class else "Без класса",
            rule_description=record.rule.description,
            points_changed=record.points_changed,
            comment=record.comment,
            created_at=record.created_at
        )
        for record in history
    ]
    
    return {
        "items": items,
        "total_count": total_count,
        "page": page,
        "size": size,
        "total_pages": (total_count + size - 1) // size
    }

@router.get("/me/history/{assignment_id}", response_model=TeacherHistoryDetail, summary="Get specific assignment details")
async def get_assignment_detail(
    assignment_id: int,
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get details of a specific point assignment.
    """
    record = await PointHistory.filter(id=assignment_id) \
        .prefetch_related("student", "student__school_class", "rule") \
        .first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if the assignment belongs to this teacher
    if record.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="You can only view your own assignments")
    
    return TeacherHistoryDetail(
        id=record.id,
        student_name=f"{record.student.first_name} {record.student.last_name}",
        student_class=record.student.school_class.name if record.student.school_class else "Без класса",
        rule_description=record.rule.description,
        points_changed=record.points_changed,
        comment=record.comment,
        created_at=record.created_at,
        can_delete=True
    )

@router.delete("/me/history/{history_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete teacher's assignment")
async def delete_assignment(
    history_id: int,
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Delete teacher's point assignment and revert the points.
    """
    history_record = await PointHistory.get_or_none(id=history_id)
    if not history_record:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if the assignment belongs to this teacher
    if history_record.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="You can only delete your own assignments")
    
    async with in_transaction():
        # Revert the points for the student
        student = await Student.get(id=history_record.student_id)
        student.points -= history_record.points_changed
        await student.save(update_fields=["points"])
        
        # Delete the history record
        await history_record.delete()
    
    return None

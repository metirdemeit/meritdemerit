from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from tortoise.contrib.pydantic import pydantic_model_creator
from tortoise.expressions import Q

from backend.models import Student, Class, DisciplineRule
from backend.utils.security import enforce_https, get_current_user

router = APIRouter(dependencies=[Depends(enforce_https)])

# --- Pydantic Models ---

Class_Pydantic = pydantic_model_creator(Class, name="ClassOut")
Student_Pydantic = pydantic_model_creator(Student, name="StudentOut")
Rule_Pydantic = pydantic_model_creator(DisciplineRule, name="RuleOut")

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
class ClassAverageRankingItem(BaseModel):
    class_id: int
    class_name: str
    average_points: float
    student_count: int

# --- Classes Endpoints ---

@router.get("/classes", response_model=List[Class_Pydantic], summary="Get all classes")
async def get_all_classes():
    """
    Get all classes (public endpoint).
    """
    classes = Class.all()
    return await Class_Pydantic.from_queryset(classes)

@router.get("/classes/{class_id}", response_model=Class_Pydantic, summary="Get class by ID")
async def get_class_by_id(class_id: int):
    """
    Get a specific class by ID (public endpoint).
    """
    class_obj = await Class.get_or_none(id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    return await Class_Pydantic.from_tortoise_orm(class_obj)

@router.get("/classes/{class_id}/students", response_model=List[StudentWithClassResponse], summary="Get students by class")
async def get_students_by_class(class_id: int):
    """
    Get all students from a specific class (public endpoint).
    """
    class_obj = await Class.get_or_none(id=class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = await Student.filter(school_class_id=class_id).prefetch_related("school_class")
    return [await StudentWithClassResponse.from_student(student) for student in students]

# --- Students Endpoints ---

@router.get("/students", response_model=List[StudentWithClassResponse], summary="Get all students")
async def get_all_students():
    """
    Get all students (public endpoint).
    """
    students = await Student.all().prefetch_related("school_class")
    return [await StudentWithClassResponse.from_student(student) for student in students]

@router.get("/students/search", response_model=List[StudentWithClassResponse], summary="Search students by name")
async def search_students(q: str = Query(..., min_length=1)):
    """
    Search for students by first or last name (public endpoint).
    """
    students = await Student.filter(
        Q(first_name__icontains=q) | Q(last_name__icontains=q)
    ).prefetch_related("school_class")
    return [await StudentWithClassResponse.from_student(student) for student in students]


@router.get("/students/{student_id}", response_model=StudentWithClassResponse, summary="Get student by ID")
async def get_student_by_id(student_id: int):
    """
    Get a specific student by ID (public endpoint).
    """
    student = await Student.get_or_none(id=student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    await student.fetch_related("school_class")
    return await StudentWithClassResponse.from_student(student)


# --- Rules Endpoints ---

@router.get("/rules", response_model=List[Rule_Pydantic], summary="Get all rules")
async def get_all_rules():
    """
    Get all discipline rules (public endpoint).
    """
    rules = DisciplineRule.all()
    return await Rule_Pydantic.from_queryset(rules)

@router.get("/rules/{rule_id}", response_model=Rule_Pydantic, summary="Get rule by ID")
async def get_rule_by_id(rule_id: int):
    """
    Get a specific rule by ID (public endpoint).
    """
    rule = await DisciplineRule.get_or_none(id=rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return await Rule_Pydantic.from_tortoise_orm(rule)

# --- Ranking Endpoints ---

@router.get("/ranking", response_model=List[StudentWithClassResponse], summary="Get top students ranking")
async def get_top_ranking(
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get top students ranked by points (highest first, authenticated endpoint).
    """
    students = (
        await Student.all()
        .prefetch_related("school_class")
        .order_by("-points", "id")
        .limit(limit)
    )

    return [await StudentWithClassResponse.from_student(student) for student in students]





@router.get(
    "/class_average_ranking",
    response_model=List[ClassAverageRankingItem],
    summary="Get classes ranking by average points",
)
async def get_classes_average_ranking(current_user: dict = Depends(get_current_user)):
    """
    Get ranking of all classes by **average student points** (highest first, authenticated endpoint).
    """
    classes = await Class.all().prefetch_related("students")

    items: list[ClassAverageRankingItem] = []
    for class_obj in classes:
        students = [s for s in class_obj.students] if hasattr(class_obj, "students") else []
        if not students:
            continue

        total_points = sum(s.points for s in students)
        avg_points = total_points / len(students)

        items.append(
            ClassAverageRankingItem(
                class_id=class_obj.id,
                class_name=class_obj.name,
                average_points=avg_points,
                student_count=len(students),
            )
        )

    items.sort(key=lambda x: (-x.average_points, x.class_id))
    return items

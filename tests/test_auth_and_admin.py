from backend.models import Class, Student
from backend.routes.admin import StudentUpdate, TeacherCreate, TeacherUpdate, create_teacher, update_student, update_teacher
from backend.routes.webapp_auth import authenticate_user
from backend.utils.security import is_password_hashed, verify_password


async def _student(password="plain-pass"):
    cls = await Class.create(name="7А")
    return await Student.create(username="stud", password=password, first_name="S", school_class=cls)


async def test_login_upgrades_legacy_plaintext_password(db):
    student = await _student("plain-pass")

    assert await authenticate_user("stud", "wrong") is None
    user = await authenticate_user(" stud ", " plain-pass ")
    assert user is not None and user.id == student.id

    await student.refresh_from_db()
    assert is_password_hashed(student.password)
    # Still able to log in after the upgrade.
    assert await authenticate_user("stud", "plain-pass") is not None


async def test_editing_student_with_blank_password_keeps_old_password(db):
    student = await _student("plain-pass")

    result = await update_student(student.id, StudentUpdate(first_name="New", password=""))
    assert "password" not in result.model_dump()

    await student.refresh_from_db()
    assert student.first_name == "New"
    assert verify_password("plain-pass", student.password)


async def test_editing_student_with_new_password_hashes_it(db):
    student = await _student("plain-pass")
    await update_student(student.id, StudentUpdate(password="new-pass"))

    await student.refresh_from_db()
    assert is_password_hashed(student.password)
    assert await authenticate_user("stud", "new-pass") is not None
    assert await authenticate_user("stud", "plain-pass") is None


async def test_teacher_create_and_blank_update(db):
    out = await create_teacher(TeacherCreate(username="t1", first_name="T", password="tp"))
    assert await authenticate_user("t1", "tp") is not None

    await update_teacher(out.id, TeacherUpdate(first_name="T2", password="  "))
    assert await authenticate_user("t1", "tp") is not None

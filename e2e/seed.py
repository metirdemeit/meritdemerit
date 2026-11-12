"""
Seed a fresh database for the end-to-end tests.
Run from the backend checkout:  PYTHONPATH=. python <path>/e2e/seed.py
Needs DATABASE_URL and JWT_SECRET_KEY in the environment.
"""
import asyncio

from tortoise import Tortoise

from backend.config import TORTOISE_ORM
from backend.models import Admin, Class, DisciplineRule, Student, Teacher
from backend.utils.ranking_helper import recalculate_ranks
from backend.utils.security import hash_password

PASSWORD = "e2e-pass"


async def main():
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas(safe=True)
    pw = hash_password(PASSWORD)
    await Admin.create(username="e2e.admin", password=pw, first_name="Sarah", last_name="Collins")
    c7 = await Class.create(name="7A")
    c10 = await Class.create(name="10A")
    await Teacher.create(username="e2e.teacher", password=pw, first_name="Emma", last_name="Wilson", homeroom_class=c7)
    for username, first, last, cls, points in [
        ("e2e.liam", "Liam", "Carter", c7, 124),
        ("e2e.olivia", "Olivia", "Reed", c7, 97),
        ("e2e.noah", "Noah", "Bennett", c7, 65),
        ("e2e.sophia", "Sophia", "Ward", c10, 118),
    ]:
        await Student.create(username=username, password=pw, first_name=first, last_name=last, school_class=cls, points=points)
    for description, points in [("Helped a classmate", 5), ("Active in class", 3), ("Late to class", -2)]:
        await DisciplineRule.create(description=description, points=points, type="demerit" if points < 0 else "merit")
    await recalculate_ranks()
    await Tortoise.close_connections()
    print("e2e seed done")


asyncio.run(main())

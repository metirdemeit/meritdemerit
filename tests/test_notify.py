from backend.models import Class, DisciplineRule, Student, Teacher
from backend.utils import notify
from backend.utils.notify import (
    RuleLine,
    build_assignment_messages,
    homeroom_message,
    level_name,
    student_message,
)


def test_level_names_match_the_app():
    assert level_name(170) == "Merit Level 2"
    assert level_name(131) == "Merit Level 1"
    assert level_name(100) == "Standard Level"
    assert level_name(99) == "Demerit Level 1"
    assert level_name(10) == "Demerit Level 4 (critical)"


def test_student_message_text():
    text = student_message([RuleLine("Active in class", 3)], "Emma Wilson", "Great answers", 101)
    assert text.splitlines() == [
        "🟢 +3 points",
        "• Active in class (+3)",
        "From: Emma Wilson",
        "“Great answers”",
        "Your total: 101 — Standard Level",
    ]


async def _setup():
    cls = await Class.create(name="7A")
    s = await Student.create(username="s", password="p", first_name="Noah", last_name="Bennett",
                             school_class=cls, points=98, telegram_id=111)
    await Teacher.create(username="t", password="p", first_name="Emma", homeroom_class=cls, telegram_id=222)
    await Teacher.create(username="t2", password="p", first_name="Other", telegram_id=333)
    return s


async def test_homeroom_teacher_alerted_when_dropping_below_100(db):
    s = await _setup()
    rule = await DisciplineRule.create(description="Late to class", points=-3)
    msgs = await build_assignment_messages([s], [rule], "David Brown", "Late again", {s.id: -3})
    chats = [c for c, _ in msgs]
    assert chats == [111, 222]  # the student and only their homeroom teacher
    assert "dropped below 100" in msgs[1][1]


async def test_no_homeroom_alert_when_staying_above_100(db):
    s = await _setup()
    s.points = 120
    rule = await DisciplineRule.create(description="Helped a classmate", points=5)
    msgs = await build_assignment_messages([s], [rule], "Emma", "", {s.id: 5})
    assert [c for c, _ in msgs] == [111]


def test_intervention_zone_alert_text():
    s = Student(first_name="Ava", last_name="Turner")
    assert "Intervention zone: warning" in homeroom_message(s, "7A", 53, 48)
    assert homeroom_message(s, "7A", 48, 46) is None  # same zone: no repeat alert


async def test_disabled_without_token(db, monkeypatch):
    monkeypatch.delenv("BOT_TOKEN", raising=False)
    monkeypatch.setenv("NOTIFICATIONS_ENABLED", "true")
    sent = []
    monkeypatch.setattr(notify, "_deliver", lambda m: sent.append(m))
    s = await _setup()
    await notify.notify_assignment([s], [], "x", "", {s.id: 0})
    assert sent == []

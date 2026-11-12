"""
Telegram notifications sent by the school bot.

- A student gets a message whenever points are assigned to them.
- The homeroom teacher gets a message when a student of their class drops
  below 100 points or into an intervention zone (50 and below).

Sending never blocks or fails the API request: messages go out in a
background task, and errors (e.g. the user never started the bot) are logged.
Set NOTIFICATIONS_ENABLED=false to switch everything off.
"""
import asyncio
import logging
import os
from dataclasses import dataclass

from aiogram import Bot
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from backend.models import Student, Teacher

logger = logging.getLogger(__name__)

MINI_APP_URL = os.getenv("MINI_APP_URL", "https://meritdemerit-7ipp.vercel.app/")
_bot: Bot | None = None
_tasks: set[asyncio.Task] = set()


def notifications_enabled() -> bool:
    return bool(os.getenv("BOT_TOKEN")) and os.getenv("NOTIFICATIONS_ENABLED", "true").lower() in {"1", "true", "yes"}


def _get_bot() -> Bot:
    global _bot
    if _bot is None:
        _bot = Bot(token=os.environ["BOT_TOKEN"])
    return _bot


# Same thresholds as the app (src/utils/studentLevels.js)
LEVELS = [
    (162, "Merit Level 2"),
    (131, "Merit Level 1"),
    (100, "Standard Level"),
    (76, "Demerit Level 1"),
    (51, "Demerit Level 2"),
    (11, "Demerit Level 3"),
]


def level_name(points: int) -> str:
    for minimum, name in LEVELS:
        if points >= minimum:
            return name
    return "Demerit Level 4 (critical)"


def intervention_zone(points: int) -> str | None:
    if points <= 30:
        return "counsellor"
    if points <= 40:
        return "homeroom teacher"
    if points <= 50:
        return "warning"
    return None


@dataclass
class RuleLine:
    description: str
    points: int


def student_message(rules: list[RuleLine], actor: str, comment: str, total: int) -> str:
    delta = sum(r.points for r in rules)
    icon = "🟢" if delta > 0 else "🔴" if delta < 0 else "⚪️"
    lines = [f"{icon} {'+' if delta > 0 else ''}{delta} points"]
    for r in rules:
        lines.append(f"• {r.description} ({'+' if r.points > 0 else ''}{r.points})")
    lines.append(f"From: {actor}")
    if comment:
        lines.append(f"“{comment.strip()}”")
    lines.append(f"Your total: {total} — {level_name(total)}")
    return "\n".join(lines)


def homeroom_message(student: Student, class_name: str, before: int, after: int) -> str | None:
    name = f"{student.first_name} {student.last_name or ''}".strip()
    zone_before, zone_after = intervention_zone(before), intervention_zone(after)
    if zone_after and zone_after != zone_before:
        return (
            f"⚠️ {name} ({class_name}) dropped to {after} points.\n"
            f"Intervention zone: {zone_after}. Check Settings → Interventions & Alerts."
        )
    if before >= 100 > after:
        return f"⚠️ {name} ({class_name}) dropped below 100 points: now {after} ({level_name(after)})."
    return None


def _keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="📱 Open Merit & Demerit", web_app=WebAppInfo(url=MINI_APP_URL))]]
    )


async def _send(chat_id: int, text: str) -> None:
    try:
        await _get_bot().send_message(chat_id, text, reply_markup=_keyboard())
    except Exception as e:  # blocked bot, never started, network...
        logger.info("[notify] could not message %s: %s", chat_id, e)


async def _deliver(messages: list[tuple[int, str]]) -> None:
    # Telegram allows ~30 messages/second; stay well below that.
    for i, (chat_id, text) in enumerate(messages):
        await _send(chat_id, text)
        if i % 20 == 19:
            await asyncio.sleep(1)


async def build_assignment_messages(
    students: list[Student], rules, actor: str, comment: str, deltas: dict[int, int]
) -> list[tuple[int, str]]:
    """Messages for one assignment. `students` hold the points AFTER the change."""
    rule_lines = [RuleLine(r.description, r.points) for r in rules]
    messages: list[tuple[int, str]] = []
    for s in students:
        after = s.points
        before = after - deltas.get(s.id, 0)
        if s.telegram_id:
            messages.append((s.telegram_id, student_message(rule_lines, actor, comment, after)))
        if s.school_class_id is None:
            continue
        await s.fetch_related("school_class")
        alert = homeroom_message(s, s.school_class.name if s.school_class else "", before, after)
        if alert:
            async for t in Teacher.filter(homeroom_class_id=s.school_class_id, telegram_id__isnull=False):
                messages.append((t.telegram_id, alert))
    return messages


async def notify_assignment(students, rules, actor: str, comment: str, deltas: dict[int, int]) -> None:
    """Queue notifications for an assignment; returns immediately."""
    if not notifications_enabled():
        return
    try:
        messages = await build_assignment_messages(students, rules, actor, comment, deltas)
    except Exception:
        logger.exception("[notify] failed to build messages")
        return
    if messages:
        task = asyncio.create_task(_deliver(messages))
        _tasks.add(task)
        task.add_done_callback(_tasks.discard)

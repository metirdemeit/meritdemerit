"""School-wide scoring lock: admin can close point assignment or set a deadline."""
from datetime import datetime, timezone

from fastapi import HTTPException, status

from backend.models import SystemSetting

SCORING_KEY = "scoring_status"

MSG_CLOSED_BY_ADMIN = "Приём баллов закрыт администрацией школы"
MSG_TIMER_EXPIRED = "Время выставления баллов истекло по таймеру"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _default_status() -> dict:
    return {"isOpen": True, "deadline": None, "closedReason": None, "updatedAt": None}


def parse_deadline(value) -> datetime | None:
    """Parse an ISO string (or datetime) into an aware UTC datetime; None if empty/invalid."""
    if not value:
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        try:
            dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


async def get_scoring_status() -> dict:
    """Current status. A passed deadline closes scoring here, on the server."""
    setting = await SystemSetting.get_or_none(key=SCORING_KEY)
    data = _default_status()
    if setting and isinstance(setting.value, dict):
        data.update({k: setting.value.get(k, v) for k, v in data.items()})
    data["isOpen"] = bool(data["isOpen"])

    deadline = parse_deadline(data["deadline"])
    if data["isOpen"] and deadline and deadline <= _now():
        data = {
            "isOpen": False,
            "deadline": None,
            "closedReason": "timer_expired",
            "updatedAt": _now().isoformat(),
        }
        if setting:
            setting.value = data
            await setting.save()
    return data


async def save_scoring_status(is_open: bool, deadline: datetime | None, closed_reason: str | None) -> dict:
    data = {
        "isOpen": is_open,
        "deadline": deadline.isoformat() if (is_open and deadline) else None,
        "closedReason": None if is_open else (closed_reason or "manual"),
        "updatedAt": _now().isoformat(),
    }
    setting = await SystemSetting.get_or_none(key=SCORING_KEY)
    if setting:
        setting.value = data
        await setting.save()
    else:
        await SystemSetting.create(key=SCORING_KEY, value=data)
    return data


async def ensure_scoring_open() -> None:
    """Raise 403 if teachers may not assign points right now."""
    data = await get_scoring_status()
    if not data["isOpen"]:
        detail = MSG_TIMER_EXPIRED if data["closedReason"] == "timer_expired" else MSG_CLOSED_BY_ADMIN
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=detail)

import hashlib
import hmac
import json
import logging
import time
import urllib.parse
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Union

from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel, Field, model_validator

from backend.models import Student, Teacher, Admin
from backend.utils.security import create_access_token, get_current_user, verify_password, enforce_https
from backend.config import BOT_TOKEN

router = APIRouter(dependencies=[Depends(enforce_https)])
logger = logging.getLogger(__name__)


# --- Brute Force Protection ---

@dataclass
class _AttemptRecord:
    count: int = 0
    ban_until: datetime | None = None
    ban_count: int = 0


class _LoginRateLimiter:
    """
    In-memory brute force protection.
    After MAX_ATTEMPTS failed logins the *key* is banned
    (Telegram ID if есть, иначе IP) на прогрессивно
    увеличивающийся период.
    Ban durations (minutes): 5, 15, 45, 120, 240 — each subsequent ban is longer.
    On successful login the counter is fully reset.
    """
    MAX_ATTEMPTS = 3
    BAN_DURATIONS = [5, 15, 45, 120, 240]  # minutes

    def __init__(self):
        self._records: dict[str, _AttemptRecord] = defaultdict(_AttemptRecord)

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def _ban_minutes(self, ban_count: int) -> int:
        idx = min(ban_count, len(self.BAN_DURATIONS) - 1)
        return self.BAN_DURATIONS[idx]

    def check(self, key: str) -> None:
        """Raise 429 if the key (telegram_id или IP) is currently banned."""
        rec = self._records[key]
        now = self._now()
        if rec.ban_until is None:
            return
        if now < rec.ban_until:
            remaining = int((rec.ban_until - now).total_seconds())
            mins, secs = divmod(remaining, 60)
            detail = (
                f"Слишком много неверных попыток входа. "
                f"Попробуйте через {mins} мин {secs} сек."
            )
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=detail)
        # Ban expired — reset attempt counter but keep ban_count for next offence
        rec.count = 0
        rec.ban_until = None

    def failure(self, key: str) -> None:
        """Record a failed login attempt and apply a ban when the threshold is reached."""
        rec = self._records[key]
        rec.count += 1
        if rec.count >= self.MAX_ATTEMPTS:
            duration = self._ban_minutes(rec.ban_count)
            rec.ban_until = self._now() + timedelta(minutes=duration)
            rec.ban_count += 1
            rec.count = 0
            logger.warning(
                "[brute-force] key=%s banned for %d min (ban #%d)", key, duration, rec.ban_count
            )

    def success(self, key: str) -> None:
        """Reset all counters on a successful login."""
        if key in self._records:
            del self._records[key]


_limiter = _LoginRateLimiter()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _bruteforce_key_from_request(request: Request, telegram_id: int | None = None) -> str:
    """
    Ключ для лимитера:
    - если есть telegram_id -> используем его (один бан на аккаунт)
    - иначе IP (для login-json без Telegram).
    """
    if telegram_id is not None:
        return f"tg:{telegram_id}"
    return f"ip:{_client_ip(request)}"

INIT_DATA_MAX_AGE_SECONDS = 86400


def validate_telegram_hash(init_data: str, bot_token: str) -> bool:
    """Validate Telegram WebApp initData HMAC hash according to official Telegram spec."""
    if not bot_token or not init_data:
        return False
    try:
        vals = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
        if "hash" not in vals:
            return False
        received_hash = vals.pop("hash")
        vals.pop("signature", None)

        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(vals.items()))

        secret_key = hmac.new(
            b"WebAppData", bot_token.strip().encode("utf-8"), hashlib.sha256
        ).digest()

        expected_hash = hmac.new(
            secret_key, data_check_string.encode("utf-8"), hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(received_hash, expected_hash)
    except Exception as e:
        logger.error("[initData] validate_telegram_hash error: %s", e)
        return False


def parse_init_data(init_data: str) -> dict:
    """
    Parse Telegram WebApp initData, validate HMAC if BOT_TOKEN is set, and extract user.
    """
    try:
        vals = dict(urllib.parse.parse_qsl(init_data, keep_blank_values=True))
        logger.info("[initData] Parsed keys: %s", sorted(vals.keys()))

        user_raw = vals.get("user")
        if not user_raw:
            raise ValueError("No user field found in initData")

        user_data = json.loads(user_raw)
        logger.info("[initData] user_id=%s, username=%s", user_data.get("id"), user_data.get("username"))

        if not user_data.get("id"):
            raise ValueError("No user ID found in initData")

        if BOT_TOKEN and "hash" in vals:
            is_valid = validate_telegram_hash(init_data, BOT_TOKEN)
            logger.info("[initData] HMAC valid: %s", is_valid)
            if not is_valid:
                logger.warning("[initData] HMAC mismatch for user_id=%s (hash check failed)", user_data.get("id"))

        return {"user": user_data, "auth_date": vals.get("auth_date")}

    except ValueError:
        raise
    except Exception as e:
        logger.error("[initData] Parse error: %s", e)
        raise ValueError(f"Failed to parse initData: {e}")


def extract_telegram_id(init_data: str) -> int:
async def find_user_by_telegram_id(telegram_id: int | None) -> Union[Student, Teacher, Admin, None]:
    if not telegram_id:
        return None
    user = await Student.get_or_none(telegram_id=telegram_id)
    if user:
        return user
    user = await Teacher.get_or_none(telegram_id=telegram_id)
    if user:
        return user
    user = await Admin.get_or_none(telegram_id=telegram_id)
    return user


def extract_telegram_id(init_data: str | None) -> int | None:
    if not init_data:
        return None
    try:
        parsed = parse_init_data(init_data)
        user_info = parsed.get("user", {})
        return user_info.get("id")
    except Exception as e:
        logger.warning("[extract_telegram_id] Failed to parse initData: %s", e)
        return None


async def authenticate_user(username: str, password: str) -> Union[Student, Teacher, Admin, None]:
    username = username.strip()
    password = password.strip()

    user = await Student.get_or_none(username=username)
    if not user:
        user = await Teacher.get_or_none(username=username)
    if not user:
        user = await Admin.get_or_none(username=username)

    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


class TelegramInitDataLogin(BaseModel):
    init_data: str | None = Field(None)
    initData: str | None = Field(None, exclude=True)

    @model_validator(mode="after")
    def _resolve_init_data(self):
        if not self.init_data and self.initData:
            self.init_data = self.initData
        return self


class TelegramLoginWithCredentials(BaseModel):
    init_data: str | None = Field(None)
    initData: str | None = Field(None, exclude=True)
    username: str
    password: str

    @model_validator(mode="after")
    def _resolve_init_data(self):
        if not self.init_data and self.initData:
            self.init_data = self.initData
        return self


class JsonLoginCredentials(BaseModel):
    username: str
    password: str


def get_user_role(user: Union[Student, Teacher, Admin]) -> str:
    if isinstance(user, Student):
        return "student"
    elif isinstance(user, Teacher):
        return "teacher"
    return "admin"


def create_login_response(user: Union[Student, Teacher, Admin], role: str) -> dict:
    return {
        "access_token": create_access_token(
            data={"sub": str(user.id), "role": role, "username": user.username},
        ),
        "token_type": "bearer",
        "role": role,
        "user_id": user.id,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "telegram_id": user.telegram_id,
        "telegram_linked": user.telegram_id is not None,
    }


@router.post("/login-json")
async def login_json(data: JsonLoginCredentials, request: Request):
    """
    Login with plain JSON username/password (without Telegram linking).
    """
    key = _bruteforce_key_from_request(request, telegram_id=None)
    _limiter.check(key)

    if not data.username.strip() or not data.password.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password cannot be empty",
        )

    user = await authenticate_user(data.username, data.password)
    if not user:
        _limiter.failure(key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    _limiter.success(key)
    role = get_user_role(user)
    return create_login_response(user, role)


@router.post("/login")
async def first_time_login(data: TelegramLoginWithCredentials, request: Request):
    """
    First-time login: username/password + link Telegram account via initData.
    """
    telegram_id = extract_telegram_id(data.init_data)
    key = _bruteforce_key_from_request(request, telegram_id=telegram_id)
    _limiter.check(key)
    logger.info("[/login] telegram_id=%s, username=%s", telegram_id, data.username)

    if not data.username.strip() or not data.password.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password cannot be empty",
        )

    user = await authenticate_user(data.username, data.password)
    if not user:
        _limiter.failure(key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    logger.info("[/login] Authenticated: %s (id=%s, current tg=%s)", user.username, user.id, user.telegram_id)

    if telegram_id:
        existing_user = await find_user_by_telegram_id(telegram_id)
        if existing_user and existing_user.id != user.id and type(existing_user) == type(user):
            existing_user.telegram_id = None
            await existing_user.save(update_fields=["telegram_id"])
            logger.info("[/login] Unlinked telegram_id=%s from previous user=%s", telegram_id, existing_user.username)

        if user.telegram_id != telegram_id:
            user.telegram_id = telegram_id
            await user.save(update_fields=["telegram_id"])
            logger.info("[/login] Linked telegram_id=%s to user=%s", telegram_id, user.username)

    _limiter.success(key)
    role = get_user_role(user)
    return create_login_response(user, role)


@router.post("/quick")
async def quick_login(data: TelegramInitDataLogin):
    """
    Quick login for users already linked with telegram_id.
    """
    telegram_id = extract_telegram_id(data.init_data)
    logger.info("[/quick] telegram_id=%s", telegram_id)

    user = await find_user_by_telegram_id(telegram_id)
    if not user:
        logger.info("[/quick] No user found for telegram_id=%s", telegram_id)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telegram account not linked. Please login with username and password first.",
        )

    logger.info("[/quick] Found user: %s (role=%s)", user.username, get_user_role(user))
    role = get_user_role(user)
    return create_login_response(user, role)


@router.post("/telegram-login")
async def telegram_login(data: TelegramInitDataLogin):
    """
    Login with Telegram initData (alias for /quick).
    """
    telegram_id = extract_telegram_id(data.init_data)
    logger.info("[/telegram-login] telegram_id=%s", telegram_id)

    user = await find_user_by_telegram_id(telegram_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Telegram account not linked. Please login with username and password first.",
        )

    role = get_user_role(user)
    return create_login_response(user, role)


class UserProfile(BaseModel):
    id: int
    username: str
    first_name: str
    last_name: str | None
    telegram_id: int | None
    role: str
    homeroom_class_id: int | None = None
    homeroom_class_name: str | None = None


@router.get("/me", response_model=UserProfile)
async def read_users_me(current_user: Union[Student, Teacher, Admin] = Depends(get_current_user)):
    role = get_user_role(current_user)
    class_id = None
    class_name = None
    if isinstance(current_user, Teacher):
        await current_user.fetch_related("homeroom_class")
        if current_user.homeroom_class:
            class_id = current_user.homeroom_class.id
            class_name = current_user.homeroom_class.name

    return {
        "id": current_user.id,
        "username": current_user.username,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "telegram_id": current_user.telegram_id,
        "role": role,
        "homeroom_class_id": class_id,
        "homeroom_class_name": class_name,
    }


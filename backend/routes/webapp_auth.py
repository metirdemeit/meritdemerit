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


def parse_init_data(init_data: str) -> dict:
    """
    Parse Telegram WebApp initData, validate HMAC if possible.
    Always tries to extract user data.
    """
    try:
        parsed_data = urllib.parse.parse_qs(init_data)
        logger.info("[initData] Parsed keys: %s", sorted(parsed_data.keys()))

        user_data = {}
        if "user" in parsed_data:
            user_data = json.loads(parsed_data["user"][0])
            logger.info("[initData] user_id=%s, username=%s", user_data.get("id"), user_data.get("username"))

        if not user_data.get("id"):
            raise ValueError("No user ID found in initData")

        # HMAC validation (log only, don't block)
        received_hash = parsed_data.get("hash", [None])[0]
        if received_hash and BOT_TOKEN:
            data_check_arr = []
            for key in sorted(parsed_data.keys()):
                if key in ("hash", "signature"):
                    continue
                value = parsed_data[key][0]
                data_check_arr.append(f"{key}={value}")

            data_check_string = "\n".join(data_check_arr)

            secret_key = hmac.new(
                b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256
            ).digest()

            expected_hash = hmac.new(
                secret_key, data_check_string.encode(), hashlib.sha256
            ).hexdigest()

            is_valid = hmac.compare_digest(received_hash, expected_hash)
            logger.info("[initData] HMAC valid: %s", is_valid)
            if not is_valid:
                logger.warning("[initData] HMAC mismatch! received=%s expected=%s", received_hash, expected_hash)
        else:
            logger.warning("[initData] Skipping HMAC: hash=%s, BOT_TOKEN set=%s", bool(received_hash), bool(BOT_TOKEN))

        return {"user": user_data, "auth_date": parsed_data.get("auth_date", [None])[0]}

    except ValueError:
        raise
    except Exception as e:
        logger.error("[initData] Parse error: %s", e)
        raise ValueError(f"Failed to parse initData: {e}")


def extract_telegram_id(init_data: str) -> int:
    """Parse initData and return telegram user id."""
    try:
        result = parse_init_data(init_data)
        return int(result["user"]["id"])
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("[initData] extract_telegram_id error: %s", e)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid initData")


async def find_user_by_telegram_id(telegram_id: int) -> Union[Student, Teacher, Admin, None]:
    user = await Student.get_or_none(telegram_id=telegram_id)
    if not user:
        user = await Teacher.get_or_none(telegram_id=telegram_id)
    if not user:
        user = await Admin.get_or_none(telegram_id=telegram_id)
    return user


async def authenticate_user(username: str, password: str) -> Union[Student, Teacher, Admin, None]:
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
        if not self.init_data:
            raise ValueError("init_data is required")
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
            expires_delta=timedelta(hours=24),
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
    First-time login: username/password + link Telegram account via initData (optional).
    """
    telegram_id = extract_telegram_id(data.init_data) if data.init_data else None
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

    if telegram_id is not None:
        existing_user = await find_user_by_telegram_id(telegram_id)
        if user.telegram_id is not None:
            if user.telegram_id != telegram_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account is already linked to a different Telegram account.",
                )
        else:
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This Telegram account is already linked to another user.",
                )
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


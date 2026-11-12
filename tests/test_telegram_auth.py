import hashlib
import hmac
import json
import time
import urllib.parse

import pytest
from fastapi import HTTPException
from starlette.requests import Request

from backend.models import Admin
from backend.routes import webapp_auth
from backend.routes.webapp_auth import TelegramInitDataLogin, quick_login, verified_telegram_id

BOT_TOKEN = "123:test-token"


def _sign(user_id: int, auth_date: int | None = None, token: str = BOT_TOKEN) -> str:
    vals = {
        "auth_date": str(auth_date if auth_date is not None else int(time.time())),
        "query_id": "q1",
        "user": json.dumps({"id": user_id, "first_name": "X"}),
    }
    check = "\n".join(f"{k}={v}" for k, v in sorted(vals.items()))
    secret = hmac.new(b"WebAppData", token.encode(), hashlib.sha256).digest()
    vals["hash"] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return urllib.parse.urlencode(vals)


def _request() -> Request:
    return Request({"type": "http", "headers": [], "client": ("1.2.3.4", 1)})


@pytest.fixture(autouse=True)
def _token(monkeypatch):
    monkeypatch.setattr(webapp_auth, "BOT_TOKEN", BOT_TOKEN)


def test_valid_signature_is_accepted():
    assert verified_telegram_id(_sign(42)) == 42


def test_forged_or_unsigned_data_is_rejected():
    forged = urllib.parse.urlencode({"user": json.dumps({"id": 42}), "auth_date": str(int(time.time()))})
    assert verified_telegram_id(forged) is None
    assert verified_telegram_id(forged + "&hash=deadbeef") is None
    assert verified_telegram_id(_sign(42, token="999:other-bot")) is None


def test_tampered_user_is_rejected():
    tampered = _sign(42).replace("%22id%22%3A+42", "%22id%22%3A+7")
    assert verified_telegram_id(tampered) is None


def test_expired_data_is_rejected():
    assert verified_telegram_id(_sign(42, auth_date=int(time.time()) - 30 * 86400)) is None


async def test_quick_login_needs_real_signature(db):
    await Admin.create(username="boss", password="x", first_name="B", telegram_id=42)

    forged = TelegramInitDataLogin(init_data='user={"id":42}')
    with pytest.raises(HTTPException) as exc:
        await quick_login(forged, _request())
    assert exc.value.status_code == 401

    ok = await quick_login(TelegramInitDataLogin(init_data=_sign(42)), _request())
    assert ok["role"] == "admin" and ok["access_token"]

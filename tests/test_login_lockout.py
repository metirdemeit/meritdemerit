from datetime import datetime, timedelta, timezone

import pytest
from fastapi import HTTPException

from backend.models import LoginAttempt
from backend.routes.webapp_auth import _LoginRateLimiter


async def test_three_failures_lock_the_key_and_lock_is_persisted(db):
    limiter = _LoginRateLimiter()
    for _ in range(3):
        await limiter.check("ip:1.2.3.4")
        await limiter.failure("ip:1.2.3.4")

    # A fresh limiter (as after a server restart) still sees the lock.
    with pytest.raises(HTTPException) as exc:
        await _LoginRateLimiter().check("ip:1.2.3.4")
    assert exc.value.status_code == 429
    rec = await LoginAttempt.get(key="ip:1.2.3.4")
    assert rec.ban_count == 1


async def test_expired_lock_is_lifted_and_next_lock_is_longer(db):
    limiter = _LoginRateLimiter()
    await LoginAttempt.create(key="tg:7", ban_count=1, ban_until=datetime.now(timezone.utc) - timedelta(seconds=1))
    await limiter.check("tg:7")  # expired: no error
    for _ in range(3):
        await limiter.failure("tg:7")
    rec = await LoginAttempt.get(key="tg:7")
    remaining = rec.ban_until.replace(tzinfo=rec.ban_until.tzinfo or timezone.utc) - datetime.now(timezone.utc)
    assert timedelta(minutes=14) < remaining <= timedelta(minutes=15)


async def test_success_clears_the_record(db):
    limiter = _LoginRateLimiter()
    await limiter.failure("ip:9.9.9.9")
    await limiter.success("ip:9.9.9.9")
    assert not await LoginAttempt.exists(key="ip:9.9.9.9")

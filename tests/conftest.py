import os

# Required before backend modules are imported.
os.environ.setdefault("JWT_SECRET_KEY", "test-secret")
os.environ.setdefault("RUN_BOT", "false")
os.environ.setdefault("NOTIFICATIONS_ENABLED", "false")

import pytest
from tortoise import Tortoise


@pytest.fixture
async def db():
    """Fresh in-memory SQLite database with the app models for each test."""
    await Tortoise.init(db_url="sqlite://:memory:", modules={"models": ["backend.models"]})
    await Tortoise.generate_schemas()
    yield
    await Tortoise.close_connections()

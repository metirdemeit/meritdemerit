import os

from aiogram import Bot, Dispatcher
from dotenv import load_dotenv

from bot.handlers import start, admin, teacher, student


load_dotenv()


def build_dispatcher() -> Dispatcher:
    dp = Dispatcher()
    dp.include_router(start.router)
    dp.include_router(admin.router)
    dp.include_router(teacher.router)
    dp.include_router(student.router)
    return dp


def build_bot() -> Bot:
    token = os.getenv("BOT_TOKEN")
    if not token:
        raise RuntimeError("BOT_TOKEN is required")
    return Bot(token=token)


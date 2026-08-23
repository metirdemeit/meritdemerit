from aiogram import Router, types
from aiogram.filters import CommandStart

from bot.keyboards.main_menu import main_menu_keyboard

router = Router()

@router.message(CommandStart())
async def handle_start(message: types.Message):
    """
    This handler will be called when user sends `/start` command.
    It sends a welcome message and the main menu keyboard.
    """
    user_name = message.from_user.first_name or message.from_user.full_name or "пользователь"
    text = (
        f"Здравствуйте, {user_name}! 👋\n\n"
        "Добро пожаловать в школьную систему Merit & Demerit.\n"
        "Нажмите кнопку ниже, чтобы открыть приложение."
    )
    await message.answer(text, reply_markup=main_menu_keyboard())


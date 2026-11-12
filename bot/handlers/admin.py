from aiogram import Router, types
from aiogram.filters import Command
from aiogram.types import BufferedInputFile

from tortoise.transactions import in_transaction

from backend.models import Admin, Student, PointHistory, AdminPointHistory
from backend.utils.quarter_export import build_quarter_export_zip_bytes

router = Router()


@router.message(Command("export_quarter"))
async def export_quarter(message: types.Message):
    """
    Admin-only command: export history+students as ZIP and send it back to Telegram.
    """
    tg_id = message.from_user.id if message.from_user else None
    if tg_id is None:
        await message.answer("Could not determine your Telegram ID.")
        return

    is_admin = await Admin.get_or_none(telegram_id=tg_id)
    if not is_admin:
        await message.answer("Access denied.")
        return

    zip_bytes, filename = await build_quarter_export_zip_bytes()
    doc = BufferedInputFile(zip_bytes, filename=filename)
    await message.answer_document(doc, caption="Quarter export: history.csv + students.csv")


@router.message(Command("reset_quarter"))
async def reset_quarter(message: types.Message):
    """
    Admin-only command:
    - delete all point histories
    - reset all students points to default (100)
    """
    tg_id = message.from_user.id if message.from_user else None
    if tg_id is None:
        await message.answer("Could not determine your Telegram ID.")
        return

    is_admin = await Admin.get_or_none(telegram_id=tg_id)
    if not is_admin:
        await message.answer("Access denied.")
        return

    # Safety: require explicit confirmation.
    text = (message.text or "").strip().lower()
    if text not in {"/reset_quarter confirm", "reset_quarter confirm", "/reset_quarterconfirm"}:
        await message.answer("Please confirm: send `/reset_quarter confirm`.")
        return

    async with in_transaction():
        deleted_ph = await PointHistory.all().delete()
        deleted_aph = await AdminPointHistory.all().delete()
        updated_students = await Student.all().update(points=100)

    await message.answer(
        "Quarter has been reset.\n"
        f"Deleted PointHistory: {deleted_ph}\n"
        f"Deleted AdminPointHistory: {deleted_aph}\n"
        f"Students reset: {updated_students}\n"
        "Everyone now has 100 points."
    )

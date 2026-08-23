from aiogram.types import WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

import os

# Mini App URL - Vercel Frontend
MINI_APP_URL = os.getenv("MINI_APP_URL", "https://meritdemerit-7ipp.vercel.app/")



def main_menu_keyboard():
    """
    Creates an inline keyboard with a button to launch the Mini App.
    """
    builder = InlineKeyboardBuilder()

    # Create a WebAppInfo object
    web_app_info = WebAppInfo(url=MINI_APP_URL)

    # Add a button that launches the web app
    builder.button(
        text="📱 Открыть Merit & Demerit",
        web_app=web_app_info
    )

    # The keyboard will have one button in one row
    builder.adjust(1)

    return builder.as_markup()


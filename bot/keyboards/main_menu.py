from aiogram.types import WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

# Mini App URL - update this when deploying
MINI_APP_URL = "https://dem-p8gd.onrender.com/"


def main_menu_keyboard():
    """
    Creates an inline keyboard with a button to launch the Mini App.
    """
    builder = InlineKeyboardBuilder()

    # Create a WebAppInfo object
    web_app_info = WebAppInfo(url=MINI_APP_URL)

    # Add a button that launches the web app
    builder.button(
        text="Open Discipline App",
        web_app=web_app_info
    )

    # The keyboard will have one button in one row
    builder.adjust(1)

    return builder.as_markup()

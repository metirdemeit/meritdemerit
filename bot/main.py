import asyncio
import logging

from dotenv import load_dotenv

from tortoise import Tortoise

from backend.config import TORTOISE_ORM
from bot.app import build_bot, build_dispatcher

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)


async def main():
    """Start the bot."""
    bot = build_bot()
    dp = build_dispatcher()

    # Init DB for bot handlers that need it
    await Tortoise.init(config=TORTOISE_ORM)
    try:
        # This will skip any updates that were received while the bot was offline
        await bot.delete_webhook(drop_pending_updates=True)
        # Start polling
        await dp.start_polling(bot)
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    logging.info("Starting bot...")
    asyncio.run(main())

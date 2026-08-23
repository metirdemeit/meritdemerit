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


import httpx
from bot.keyboards.main_menu import MINI_APP_URL


async def keep_alive_task():
    """Periodically pings the Render Web App URL to prevent cold start sleeping."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        while True:
            try:
                await asyncio.sleep(240)  # Every 4 minutes (Render sleeps after 15m)
                resp = await client.get(MINI_APP_URL)
                logging.info("Keep-alive ping sent to %s (Status: %d)", MINI_APP_URL, resp.status_code)
            except Exception as e:
                logging.warning("Keep-alive ping error: %s", e)


async def main():
    """Start the bot."""
    bot = build_bot()
    dp = build_dispatcher()

    # Init DB for bot handlers that need it
    await Tortoise.init(config=TORTOISE_ORM)
    try:
        # Start keep-alive background task to keep Render awake
        asyncio.create_task(keep_alive_task())

        # This will skip any updates that were received while the bot was offline
        await bot.delete_webhook(drop_pending_updates=True)
        # Start polling
        await dp.start_polling(bot)
    finally:
        await Tortoise.close_connections()



if __name__ == "__main__":
    logging.info("Starting bot...")
    asyncio.run(main())

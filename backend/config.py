import os
from dotenv import load_dotenv

try:
    load_dotenv()
except:
    pass

# Get DATABASE_URL and convert postgresql:// to postgres:// for Tortoise ORM compatibility
# For deployment, prioritize environment variables
database_url = os.getenv("DATABASE_URL")
if not database_url:
    # Fallback to individual components for local development
    postgres_user = os.getenv("POSTGRES_USER", "postgres")
    postgres_password = os.getenv("POSTGRES_PASSWORD", "45238")
    postgres_host = os.getenv("POSTGRES_HOST", "localhost")
    postgres_port = os.getenv("POSTGRES_PORT", "5432")
    postgres_db = os.getenv("POSTGRES_DB", "school")
    database_url = f"postgres://{postgres_user}:{postgres_password}@{postgres_host}:{postgres_port}/{postgres_db}"

if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgres://", 1)

DATABASE_URL = database_url

# Telegram Bot Configuration
BOT_TOKEN = os.getenv("BOT_TOKEN")

# Secret key to access /docs and /redoc
DOCS_SECRET = os.getenv("DOCS_SECRET")

TORTOISE_ORM = {
    "connections": {"default": DATABASE_URL},
    "apps": {
        "models": {
            "models": ["backend.models", "aerich.models"],
            "default_connection": "default",
        },
    },
}

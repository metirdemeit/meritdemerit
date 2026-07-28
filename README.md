# School Discipline Bot

Система управления дисциплинарными баллами для школы.

## Структура проекта

- `/backend` - FastAPI API (Python)
- `/bot` - Telegram бот (aiogram)
- `/migrations` - Миграции БД

## Роли

- **Ученик**: просмотр баллов, истории
- **Учитель**: выставление баллов ученикам
- **Админ**: управление системой

## Запуск

### Docker

```bash
docker-compose up --build -d
```

### Локально

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Bot
cd bot
python main.py
```

## Переменные окружения (.env)

```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=school_discipline
DATABASE_URL=postgresql://postgres:password@localhost:5432/school_discipline

# JWT
JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256

# Telegram
BOT_TOKEN=your_bot_token
```

## API

- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

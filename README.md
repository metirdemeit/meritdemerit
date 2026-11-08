# Merit & Demerit

Система дисциплинарных баллов для школы: Telegram Mini App + бот + API.

## Ветки и деплой

| Ветка | Что внутри | Деплой |
|---|---|---|
| `frontend` | React + Vite (Telegram Mini App) | **Vercel** — каждый push сразу уходит в прод |
| `backend` | FastAPI + Tortoise ORM + aiogram-бот | **Render** — каждый push сразу уходит в прод |
| `main` | этот README, настройки Dependabot; код ниже — старый снимок backend (август 2026) | не деплоится |

**Актуальный код — только в ветках `frontend` и `backend`.**

## Как вносить изменения

1. Создайте ветку от нужной: `git checkout -b fix/что-то frontend` (или `backend`).
2. Откройте Pull Request в `frontend`/`backend` — запустится CI (GitHub Actions):
   - frontend: ESLint (ошибки) + `npm run build`
   - backend: ruff + `pytest`
3. Мержите только при зелёном CI — после мержа изменения автоматически деплоятся.

Dependabot раз в месяц открывает PR с минорными обновлениями и патчами безопасности
в `frontend` и `backend`. Мажорные версии обновляются вручную.

## Локальный запуск

```bash
# frontend
git checkout frontend
cp .env.example .env.local   # dev-логины, по желанию
npm ci && npm run dev

# backend (Python 3.11)
git checkout backend
cp .env.example .env         # заполнить JWT_SECRET_KEY, БД, BOT_TOKEN
pip install -r requirements.txt
pytest                       # тесты не требуют Postgres
uvicorn backend.main:app --reload
```

---

## Старое описание (снимок backend)


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

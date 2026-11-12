# 🚀 MeritDemerit System — Context & Knowledge Base (AI Context File)

> **Назначение этого файла:** Единый источник правды (Single Source of Truth) для разработчиков и ИИ-агентов (Claude, ChatGPT, Gemini, Copilot, DeepSeek).
> **Цель:** Исключить затраты токенов на исследование кодовой базы с нуля, предотвратить регрессии и предоставить исчерпывающий контекст архитектуры, окружения, API и истории изменений.
> **Последнее обновление:** 2026-11-12 (фронт `30d5203`, бэк `abb05c5`).

---

## ⚡ 0. Быстрый старт для нового разработчика / ИИ-агента

1. **Один GitHub-репозиторий, две ветки** (`https://github.com/metirdemeit/meritdemerit`):
   - `frontend` — React-приложение (этот файл лежит здесь). Деплой: **Vercel** (автоматически при push).
   - `backend` — FastAPI + Tortoise ORM + aiogram-бот. Деплой: **Render** (`https://meritdemerit.onrender.com`, автоматически при push).
   - Ветки деплоятся **независимо**: если изменение затрагивает API, сначала пушь `backend`, потом `frontend`.
2. **Приложение обязано работать и как Telegram Mini App, и в обычном браузере.** Блокировать браузер нельзя (`canRunApp()` всегда `true`).
3. **Язык интерфейса и сообщений API — английский.** Новые тексты в UI и в ответах бэкенда пиши по-английски.
4. **Перед пушем проверь:**
   - фронт: `npm run lint` (0 предупреждений, `--max-warnings 0`), `npm test`, `npm run build`;
   - бэк: `ruff check --isolated --select F,E9 backend bot migrations tests` и `pytest -q`.
5. **После любой фичи/фикса** добавь строку в Changelog (раздел 8) этого файла.

---

## 📌 1. Обзор проекта (Project Overview)

- **Название:** MeritDemerit System (Telegram Mini App & Web Dashboard)
- **Цель системы:** Учет академических поощрений (**Merit**, положительные баллы) и дисциплинарных замечаний (**Demerit**, отрицательные баллы) для школы/лицея. Классы 6–12, рейтинги раздельно по параллелям 6–8 и 9–12.
- **Базовый баланс ученика:** `100` баллов.
- **Уровни** (единый источник: `src/utils/studentLevels.js`, дублируется в бэкенде `backend/utils/notify.py` — меняй оба места):

| Уровень | Баллы |
| :--- | :---: |
| Merit Level 2 | `162+` |
| Merit Level 1 | `131–161` |
| Standard Level | `100–130` |
| Demerit Level 1 | `76–99` |
| Demerit Level 2 | `51–75` |
| Demerit Level 3 | `11–50` |
| Demerit Level 4 (Critical) | `≤ 10` |

- **Зоны мер реагирования (interventions):** `≤ 50` — warning, `≤ 40` — классный руководитель, `≤ 30` — психолог/администрация.
- **Тип правила определяется знаком баллов:** отрицательные баллы → `demerit`, положительные → `merit` (и на фронте, и на бэке; при старте бэкенд чинит старые записи).

---

## 🛠 2. Стек технологий и окружение (Tech Stack & Environment)

### Фронтенд (ветка `frontend`):
- **Фреймворк & Сборщик:** React 18, Vite 6, `@vitejs/plugin-react-swc`. `base: "/"` (абсолютный — нужен для BrowserRouter на вложенных роутах).
- **UI:** Material-UI v5 (`@mui/material`, `@mui/icons-material`, Emotion), Vanilla CSS (`src/index.css`).
- **State Management:** Zustand 5.
- **HTTP & Уведомления:** Axios, React Hot Toast.
- **Telegram:** `@telegram-apps/sdk-react` + скрипт `telegram-web-app.js` в `index.html`.
- **Роутинг:** React Router DOM v6, страницы лениво грузятся по ролям (`React.lazy`).
- **Тесты:** Vitest (unit, `src/utils/__tests__/`), Playwright (e2e, `e2e/`).
- Удалены и **не возвращать**: `eruda`, `formik`, `yup`, `react-helmet`, `framer-motion`, `@telegram-apps/mate`, gh-pages.

### Бэкенд (ветка `backend`):
- **FastAPI** + **Tortoise ORM** (PostgreSQL), миграции через `aerich` (`migrations/models/`) **плюс** идемпотентные `ALTER/CREATE ... IF NOT EXISTS` при старте в `backend/main.py` — новые колонки/таблицы добавляй туда же.
- **aiogram**-бот в `bot/` (запускается вместе с API при `RUN_BOT=true`).
- Пароли — bcrypt (старые plaintext-пароли апгрейдятся при входе).
- Render free tier засыпает: первый запрос может идти 30–50 с.

### Переменные окружения фронта (`.env.local`, шаблон `.env.example`):
```env
VITE_API_URL=            # URL бэкенда; по умолчанию прод https://meritdemerit.onrender.com
VITE_DEV_ADMIN_USER=...  # кнопки быстрого входа, работают только в `npm run dev`
VITE_DEV_ADMIN_PASS=...
VITE_DEV_TEACHER_USER=... / VITE_DEV_TEACHER_PASS=...
VITE_DEV_STUDENT_USER=... / VITE_DEV_STUDENT_PASS=...
```

### Переменные окружения бэка (`.env`, шаблон `.env.example`):
| Переменная | Назначение |
| :--- | :--- |
| `DATABASE_URL` или `POSTGRES_*` | Подключение к PostgreSQL |
| `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT |
| `BOT_TOKEN` | Токен бота; им же проверяется HMAC-подпись Telegram initData |
| `MINI_APP_URL` | URL фронта для кнопки в боте |
| `RUN_BOT` | `false` — не запускать бота (тесты, CI) |
| `NOTIFICATIONS_ENABLED` | `false` — выключить уведомления в Telegram |
| `INIT_DATA_MAX_AGE_SECONDS` | Максимальный возраст `auth_date` в initData |
| `RATE_LIMIT_PER_MINUTE` | Лимит запросов на IP (по умолчанию 600 — вся школа часто за одним IP) |
| `ALLOW_HTTP_LOCAL`, `DOCS_SECRET`, `SCHOOL_ID`, `SCHOOL_SECRET_KEY`, `CENTRAL_BACKEND_URL`, `GOOGLE_SERVICE_ACCOUNT_FILE` | Прочее |

---

## 🗂 3. Архитектура и структура каталогов (Project Structure)

### Фронтенд (`frontend`):
```text
/
├── index.html                   # Точка входа (подключен Telegram WebApp SDK)
├── vite.config.js
├── playwright.config.js         # e2e-конфиг
├── vercel.json                  # SPA-rewrites для Vercel
├── USER_GUIDE.md                # Ссылка на иллюстрированный гид
├── PROJECT_HISTORY.md           # Этот файл
├── public/guide/index.html      # Иллюстрированное руководство пользователя (/guide/index.html)
├── e2e/
│   ├── seed.py                  # Заполняет тестовую БД (запускать из корня бэкенда с PYTHONPATH=.)
│   └── smoke.spec.js            # 4 e2e-сценария
├── .github/workflows/frontend-ci.yml
└── src/
    ├── app/
    │   ├── App.jsx              # Корень: инициализация Telegram/safe areas, auth один раз за загрузку
    │   ├── LoginPage.jsx
    │   ├── admin/               # Dashboard, Users, Codes, Settings (таймер/блокировка), Ranking, RiskRegistry
    │   ├── teacher/             # Dashboard (homeroom), Students, Rules
    │   ├── student/             # Dashboard (профиль, прогресс, история — один экран)
    │   └── components/          # AssignmentTable (таблица/карточки на телефоне), CommonRankingTable,
    │                            # ScoringCountdownWidget, TeachersStatTable, dialogs/, containers/
    ├── components/guide/        # Встроенный пошаговый тур (GuideTour, guideSteps по ролям, GuideButton "?")
    ├── routes/routes.jsx        # Роуты и ProtectedRoute по ролям
    ├── services/api.js          # Axios: авторизация, initData, авто-повтор, нормализация ошибок
    ├── store/                   # Zustand: auth, admin, teacher, student, common, scoring, guide, detention, intervention
    └── utils/
        ├── studentLevels.js     # Уровни и цвета
        ├── progress.js          # Прогресс до следующего уровня, данные графика
        ├── classNames.js        # Сопоставление классов (кириллица сохраняется: 7А ≠ 7Б)
        ├── apiErrors.js         # Ошибки API → строка (422 приходит списком объектов)
        ├── telegramCheck.js     # Определение Telegram и парсинг initData
        ├── openGuide.js         # Открытие гида (в Telegram через WebApp.openLink)
        ├── url.js               # Базовый URL API (VITE_API_URL)
        └── __tests__/           # Vitest
```

### Бэкенд (`backend`):
```text
/
├── backend/
│   ├── main.py                  # FastAPI app, startup-миграции, запуск бота
│   ├── models.py                # Tortoise-модели (Student, Teacher, Class, PointHistory,
│   │                            # AdminPointHistory, DisciplineRule, SystemSetting, LoginAttempt, ...)
│   ├── config.py
│   ├── routes/                  # admin.py, teachers.py, students.py, common.py, webapp_auth.py
│   ├── middleware/              # rate_limit.py, logging.py
│   └── utils/                   # ranking_helper (ранги), scoring (блокировка/дедлайн), notify (уведомления),
│                                # security (пароли, initData HMAC), rules_helper, quarter_export
├── bot/                         # aiogram-бот (handlers, keyboards, middlewares)
├── migrations/models/           # aerich
├── tests/                       # pytest на SQLite in-memory
├── COMPLETE_API_DOCUMENTATION.md
└── .github/workflows/backend-ci.yml
```

---

## 🔐 4. Аутентификация, Роли и Поведение API

### Авторизация:
1. **Обычный браузер:** логин/пароль через `/auth/login-json`.
2. **Telegram:** initData передаётся в заголовке `X-Telegram-Init-Data`. Эндпоинты `/auth/quick`, `/auth/telegram-login` и привязка Telegram в `/auth/login` **требуют валидную HMAC-подпись initData (по `BOT_TOKEN`) и свежий `auth_date`**. Подделать вход по чужому `telegram_id` больше нельзя.
3. **Токен:** `localStorage` (`access_token`), заголовок `Authorization: Bearer <token>`.
4. **Блокировка после неверных паролей** хранится в таблице `login_attempt` и переживает перезапуск сервера.
5. **Роли:**
   - `admin` — `/admin/*`: пользователи, правила, история школы (удаление, экспорт CSV/HTML), таймер и блокировка выставления баллов, рейтинги (`/admin/ranking`, `/ranking`).
   - `teacher` — `/teacher/*`: свой homeroom-класс (из профиля), выставление баллов любым классам, история.
   - `student` — `/student/*`: баланс, уровень, прогресс, история. **Рейтинг ученикам и учителям не показывается.**
6. Списки учеников, поиск, рейтинг и правила **требуют входа**.

### Ключевые правила бизнес-логики:
- **Блокировка выставления баллов — серверная:** `GET/POST /school/scoring-status` (POST только админ). Пока закрыто или истёк дедлайн, `POST /teacher/workflow/assign` возвращает 403. Фронт не должен «успешно» менять статус локально.
- **История админа и учителя в разных таблицах с пересекающимися id.** В `GET/DELETE /admin/history/{id}` всегда передавай `?source=teacher|admin`.
- **Баллы меняются атомарно** (F-выражения) во всех путях начисления и отката; после изменения баллов пересчитываются ранги (`ranking_helper.recalculate_ranks()`).
- **Уведомления (`backend/utils/notify.py`):** ученику — сообщение о каждом начислении; классному руководителю — если ученик упал ниже 100 или в зону мер реагирования. Отправляются в фоне. Сообщение доходит только тем, кто хоть раз открывал бота.

### Важные нюансы в `src/services/api.js`:
- **Auto-retry (3 сек)** для 5xx и сетевых ошибок, пока Render просыпается. **Не удалять.**
- **401** генерирует событие `unauthorized` и очищает сессию без ретраев.
- **422** приходит списком объектов; он нормализуется в строку (`apiErrors.js`). Рендер «сырого» списка ронял страницу.
- **Осторожно с циклами запросов в `useEffect`:** раньше пустой список правил/учеников вызывал бесконечные запросы и упирался в rate limit.

---

## 🧪 5. Тесты, CI и локальный запуск

### Фронтенд:
```bash
npm ci
npm run dev          # http://localhost:5173, API = VITE_API_URL или прод
npm run lint         # должно быть 0 предупреждений
npm test             # Vitest
npm run build && npm run preview
npm run test:e2e     # Playwright, нужен запущенный бэкенд и preview (см. ниже)
```

### Бэкенд:
```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
pytest -q            # SQLite in-memory, Postgres не нужен
uvicorn backend.main:app --reload
```

### Полный стек локально (как в e2e CI):
1. Postgres: `docker run -d -p 127.0.0.1:55432:5432 -e POSTGRES_PASSWORD=... postgres:16-alpine`.
2. Бэкенд с `DATABASE_URL=...55432...`, `RUN_BOT=false`, `NOTIFICATIONS_ENABLED=false`, `BOT_TOKEN=123:test-token`.
3. Сид: из корня бэкенда `PYTHONPATH=. python <путь к фронту>/e2e/seed.py`.
4. Фронт: `VITE_API_URL=http://127.0.0.1:<порт> npm run build && npx vite preview --port 4173`.
5. Эмуляция Telegram в браузере: подписать initData тем же `BOT_TOKEN` и открыть `http://127.0.0.1:4173/#tgWebAppData=<initData>`.

### CI (GitHub Actions):
- `frontend-ci.yml`: job `checks` (lint + unit + build) → job `e2e` (поднимает Postgres и API из ветки `backend`, сид, Playwright). **e2e закреплён на `ubuntu-24.04`**: Playwright 1.55 не ставит Chromium на `ubuntu-latest` (= Ubuntu 26.04). Вернуть `ubuntu-latest` можно после обновления Playwright.
- `backend-ci.yml`: ruff + pytest.

---

## ⚠️ 6. Подводные камни (Gotchas)

- Telegram WebView: скачивание файлов, всплывающие окна и внешние ссылки работают иначе. Для ссылок используй `WebApp.openLink`, для экспорта — Share Sheet/фоллбеки.
- Safe areas: используй CSS-переменные `--app-safe-top` / `--app-safe-bottom` (из Telegram insets или `env()`), а не жёсткие отступы.
- Классы с кириллицей (`7А`, `7Б`) нельзя нормализовать удалением не-латинских символов.
- Порядок классов фиксированный 6A → 12B (`sortClassesFixed`), не зависит от рейтинга.
- Эндпоинт в FastAPI: не вставляй функции между декоратором `@router.post(...)` и обработчиком (баг `4b18f52`). Тест проверяет привязку роутов правил.
- Уровни заданы в двух местах (фронт `studentLevels.js`, бэк `notify.py`).

---

## 📋 7. Открытые задачи (Open Items)

- **Бэкапы БД не настроены.** Workflow с дампом в артефакты публичного репозитория отклонён по безопасности. Варианты: бэкапы Render (платный Postgres), приватный репозиторий, локальный `pg_dump` по расписанию.
- **Уведомления на реальном боте ещё не проверены вручную** (локально отправка подменялась).
- Идеи из бэклога: Undo после выставления баллов; избранные правила у учителя; импорт учеников из CSV/Excel; сброс четверти из админки (сейчас только `/reset_quarter` в боте); пинг против засыпания Render; журнал действий админа; пагинация истории и инкрементальный пересчёт рангов на сервере; переключатель RU/EN.
- В `src/utils/telegramCheck.js` остался устаревший TODO с закомментированной проверкой Telegram — можно удалить.

---

## 📜 8. Полная история изменений и ключевых фиксов (Changelog & Commits)

> Пометка после хеша: (F) — ветка `frontend`, (B) — `backend`. Новые записи добавляй сверху.

| Хеш коммита | Дата | Тип | Описание изменения |
| :--- | :---: | :---: | :--- |
| **`30d5203`** (F) | 2026-11-12 | `ci(frontend)` | e2e-job закреплён на `ubuntu-24.04`: Playwright 1.55 не ставит Chromium на `ubuntu-latest` (Ubuntu 26.04). |
| **`fa6a5a2`** (F) | 2026-11-12 | `feat(frontend)` | Карточка прогресса ученика (баллы до следующего уровня, график за четверть, суммы меритов/демеритов, шаг тура); компактные заголовки на телефоне; линтер исправлен (583 ложных предупреждения → 0); удалены 8 мёртвых файлов и неиспользуемые зависимости; Vitest unit-тесты; Playwright e2e против настоящего бэкенда в CI. |
| **`abb05c5`** (B) | 2026-11-12 | `feat(backend)` | Уведомления в Telegram (ученику о каждом начислении, классному руководителю о падении ниже 100 / в зону мер), в фоне, `NOTIFICATIONS_ENABLED`; блокировки входа в таблице `login_attempt`. |
| **`ddbcc51`** (F) | 2026-11-12 | `feat(frontend)` | История на телефоне — карточками; иллюстрированный гид `/guide/index.html` (ссылки со страницы входа и из тура); нормализация 422-ошибок; при создании правила тип задаёт знак баллов. |
| **`4b18f52`** (B) | 2026-11-12 | `fix(backend)` | `POST /admin/rules` был привязан к хелперу вместо `create_rule` (422); тест на привязку роутов. |
| **`2fbc8d6`** (B) | 2026-11-12 | `feat(backend)` | Все сообщения API и бота на английском. |
| **`95e7416`** (F) | 2026-11-12 | `feat(frontend)` | Весь интерфейс на английском, даты в формате en-GB. |
| **`789b7e8`** (B) | 2026-11-12 | `fix(backend)` | Тип правила следует из знака баллов; при старте исправляются старые записи. |
| **`a6500dc`** (F) | 2026-11-12 | `feat(frontend)` | Встроенный пошаговый тур по ролям (ученик 5, учитель 8, админ 9 шагов) с подсветкой элементов, автозапуск при первом входе, кнопка «?»; цвета и знаки правил по баллам. |
| **`722f088`** (B) | 2026-11-12 | `fix(backend)` | Проверка HMAC-подписи initData для Telegram-входа (раньше можно было войти по чужому `telegram_id`); `?source=` для истории админа; атомарное обновление баллов; пересчёт рангов при удалении учителем; эндпоинты списков требуют входа; rate limit 600/мин (`RATE_LIMIT_PER_MINUTE`). |
| **`d983246`** (F) | 2026-11-12 | `fix(frontend)` | Работа в обычном браузере (не блокируется); выход у учителя; auth инициализируется один раз; устранены бесконечные циклы `GET /students` и `GET /rules`; удаление истории с `source`; кириллица в классах; homeroom из профиля; safe areas; lazy-loading страниц (бандл 830 → ~140 kB); доступность карточек; `VITE_API_URL`. |
| **`a619a25`** (F) | 2026-11-09 | `fix(frontend)` | Блокировка выставления баллов полностью серверная: админ не получает ложный успех, учителя/ученики не шлют POST статуса, учитель обновляет статус перед начислением. |
| **`7c1e8c7`** (B) | 2026-11-09 | `fix(backend)` | Восстановлены `/school/scoring-status`, модель `SystemSetting` и проверка в `/teacher/workflow/assign` (случайно удалены в `8346fd3`); тесты. |
| **`da5defa`** (B) | 2026-11-08 | `fix(backend)` | Пароли в bcrypt (plaintext апгрейдится при входе); редактирование с пустым паролем больше не стирает пароль; пароли не возвращаются в ответах; pytest + CI. |
| **`8d8045c`** (B) | 2026-11-08 | `fix(backend)` | Дельты рангов не сбрасываются при рестарте; починен `pyproject.toml`; переименована дублирующая миграция в `5_`. |
| **`d4107b3`** (F) | 2026-11-08 | `fix(frontend)` | `base: "/"` (белый экран при перезагрузке вложенного роута); удалены шаблонные GitLab CI и gh-pages; пакет переименован в `meritdemerit`; `.env.example` и CI. |
| **`96e59a1`** (F) | 2026-11-08 | `fix(frontend)` | Исправлены lint-ошибки (в т.ч. отсутствующий импорт `toast` в `teacherStore`), `npm audit fix`. |
| **`55b8d6e`** (F) | 2026-11-02 | `chore(cleanup)` | Удалены устаревшие конфиги и pycache бэкенда из ветки `frontend`. |
| **`ca79b89`** | 2026-11-02 | `chore(cleanup)` | Оптимизирована директория фронтенда: удалены 3447 файлов `.venv` из git-индекса ветки `frontend` без удаления с диска, удалены устаревшие `.eslintrc.cjs` и неиспользуемый `components.json`, удалены фантомные каталоги `backend/` и `migrations/` с кэшами `__pycache__`, обновлен `.gitignore`. |
| **`a32004b`** | 2026-11-02 | `feat(student,ui)` | Объединены страницы Dashboard и History у ученика в единый компактный экран: карточка профиля + полный раздел Points History с таблицей начислений (`AssignmentTable`) и пагинацией; добавлена кнопка Log out в хэдере; скрыта нижняя панель навигации `BottomNavbar` для роли `student` (так как экран теперь один); роут `/student/history` перенаправляет на `/student/dashboard`. |
| **`888de5c`** | 2026-11-02 | `feat(ranking,access)` | Рейтинг полностью скрыт от учеников и учителей (удалены секции рейтингов и лишние сетевые запросы из `student/DashboardPage.jsx` и `teacher/DashboardPage.jsx`); доступ к рейтингу по путям `/admin/ranking` и `/ranking` сохранён исключительно для роли администратора (`AdminRankingPage.jsx` с защитой `ProtectedRoute requiredRole="admin"` и быстрым переходом с дашборда администратора). |
| **`43efad4`** | 2026-10-28 | `feat(teacher,api)` | Реализован эндпоинт `GET /teacher/students/{student_id}/history` на бэкенде (возвращает полную сводную историю баллов ученика от всех учителей и администрации для авторизованных преподавателей); во фронтенде в `teacherStore.js` настроен вызов этого эндпоинта в `fetchStudentFullHistory`; в `StudentsPage.jsx` улучшена фильтрация по `student_id` и двухстороннему сопоставлению ФИО. |
| **`f09316a`** | 2026-10-28 | `fix(history,api)` | Полный чекап и исправление истории учеников: эндпоинт `/admin/history/student/{id}` (PointHistoryResponse[]) теперь проверяется первым с получением полных данных (учитель, баллы, комментарии, дата); улучшен `AssignmentTable` (поддержка обеих схем `TeacherHistoryResponse` и `StudentHistoryResponse`, сокрытие пустой колонки Student при просмотре конкретного ученика); разделение `fetchHistory` и `fetchHistoryRecord(id)` в `adminStore`; очистка и фильтрация фоллбека по совпадению ФИО/логина студента. |
| **`4097dc1`** | 2026-10-27 | `fix(classes)` | Зафиксирован строгий порядок классов с 6 по 12 параллель (`sortClassesFixed` в `commonStore.js`, `StudentsPage.jsx`, `StudentsBlog.jsx`); классы гарантированно упорядочены от 6A до 12B и не меняют позицию в зависимости от рейтинга или среднего балла. |
| **`4b4cf2d`** | 2026-10-27 | `feat(ranking,admin)` | Убрано динамичное изменение рейтинга (`RankDeltaBadge`, стрелочки дельты и связанные поля); полностью налажен экспорт всей истории школы через админку: обеспечена предзагрузка всех страниц истории перед экспортом, реализован автономный клиентский генератор красивого HTML-отчета со статистикой и фильтрами (фоллбек на случай 404 бэкенда), добавлена кнопка скачивания в CSV (с UTF-8 BOM) и HTML. |
| **`a8e4728`** | 2026-10-17 | `feat(ranking)` | Фронтенд: `CommonRankingTable` расширен полями `rank_delta`, `current_rank`, `previous_rank` при мерже роостера студентов; компонент `RankDeltaBadge` показывает зелёную стрелку ↑ / красную ↓ / тире рядом с позицией; баннер «Ваша позиция» с индикатором Target Distance для ученика. |
| **`8346fd3`** | 2026-10-17 | `feat(ranking)` | Бэкенд: поля `previous_rank`/`current_rank` добавлены в модель `Student`; утилита `ranking_helper.recalculate_ranks()` пересчитывает ранги всех студентов после каждого изменения баллов (teacher assign, admin assign, admin workflow assign, delete history); миграция `4_add_rank_columns_to_student` заполняет `current_rank` через `ROW_NUMBER()`; `StudentWithClassResponse` возвращает `rank_delta = previous_rank − current_rank`. |
| **`ec95ed7`** | 2026-10-17 | `fix(scoring)` | Добавлен виджет обратного отсчета дедлайна на главную панель администратора (`DashboardPage.jsx`), улучшена синхронизация и обработка сохранения состояния в `scoringStore.js`. |
| **`6514975`** | 2026-10-17 | `fix(backend)` | Исправлена валидация администратора в `POST /school/scoring-status` через зависимость `get_current_admin` вместо словаря, предотвращён сброс дедлайна при перезаходе/перезагрузке. |
| **`867ed8e`** | 2026-10-17 | `fix(timer,ui)` | Скрыт баннер при открытом бессрочном приёме баллов (виджет отображается только при активном дедлайне или закрытом приёме). |
| **`a634479`** | 2026-10-17 | `feat(backend)` | Добавлены эндпоинты `GET /school/scoring-status` и `POST /school/scoring-status`, миграция таблицы `system_setting`, серверная валидация дедлайна в `POST /teacher/workflow/assign`. |
| **`8c42f52`** | 2026-10-17 | `feat(admin,timer)` | Панель управления таймером и дедлайном выставления баллов (`ScoringDeadlineManager` в `SettingsPages.jsx`), мгновенная блокировка в один клик, виджет живого обратного отсчета (`ScoringCountdownWidget`) на дашбордах учителя и ученика, защита от выставления баллов после дедлайна в `teacherStore.js`. |
| **`60195f6`** | 2026-10-16 | `fix(ranking)` | Добавлено изолированное хранилище `allStudents` и принудительная загрузка полного реестра в `CommonRankingTable` во избежание обрезки до 5 человек в параллели 6-8 при наличии частичных данных. |
| **`8ec3478`** | 2026-10-16 | `feat(ranking)` | Добавлен рейтинг классов по среднему баллу в общий рейтинг; исправлено отображение всех учеников в параллелях 6-8 и 9-12; удалены кнопки экспорта CSV в админке. |
| **`26f404a`** | 2026-10-05 | `feat(teacher)` | Отображение автора записи в истории ученика; алерт Attention Homeroom для выбранного класса. |
| **`b9ecf29`** | 2026-10-05 | `fix(ui)` | Расширение ширины макета контента со `sm` до `lg` на всех ключевых страницах. |
| **`044792a`** | 2026-10-05 | `feat(admin)` | Полная загрузка истории школы через многостраничный батчинг (снято ограничение в 50 записей). |
| **`2f22657`** | 2026-10-05 | `fix` | Параметры экспорта с фильтрами, выбор через autocomplete, фоллбеки истории учителей и пагинация таблиц. |
| **`1c36d1b`** | 2026-10-04 | `feat` | Полная загрузка админ-истории, опции autocomplete, сохранение выбранного homeroom, модалка истории своего класса vs начисление баллов всем классам. |
| **`c444c38`** | 2026-10-17 | `feat(ranking)` | Ранги теперь разбиты по параллелям (6–8 и 9–12), а в PointHistory пишется previous_rank_snapshot для чистого возврата к 0 дельте при удалении записи. |
| **`ddbe137`** | 2026-10-17 | `fix(ranking)` | Предотвращен дрейф и каскадный сдвиг previous_rank при пересчете рейтинга: ротация только при реальном изменении позиции. |
| **`8346fd3`** | 2026-10-17 | `feat(ranking)` | Добавлены previous_rank/current_rank в Student, rank_delta в API, пересчет рангов после изменения баллов. |
| **`1c7b7ee`** | 2026-10-17 | `feat(ranking)` | Отображение динамики рангов (RankDeltaBadge), баннер My Rank с Target Distance в рейтинговой таблице. |
| **`242f327`** | 2026-10-04 | `feat(admin)` | Кнопка экспорта истории в CSV, фильтры по классу/ученику, исправление сдвига часового пояса дат. |
| **`fc27c45`** | 2026-09-25 | `fix` | Исправлена история ученика в кабинете учителя и состояние алерта homeroom. |
| **`21b2a26`** | 2026-09-25 | `fix` | Устранено падение страницы класса учителя из-за лимита размера истории. |
| **`45fce45`** | 2026-09-25 | `fix` | Исправлен экспорт HTML на десктопе и отображение сгенерированных паролей администратора. |
| **`7d5cd6f`** | 2026-09-25 | `fix` | Сортировка учеников, видимость сгенерированных паролей, фоллбек экспорта в приложении. |
| **`51e72ac`** | 2026-09-25 | `feat/fix` | Просмотр истории учителей, выход админа из системы, исправления экспорта. |
| **`51b485d`** | 2026-09-23 | `feat(admin)` | Диалоговое окно фильтрации перед экспортом истории. |
| **`968eff7`** | 2026-09-23 | `fix(admin)` | Использование системного Share Sheet для экспорта HTML истории. |
| **`7b2712f`** | 2026-09-23 | `feat(admin)` | Добавлена кнопка экспорта истории школы в HTML. |
| **`1219e8b`** | 2026-09-04 | `fix(auth)` | Корректный сброс Telegram ID админа: 401 немедленно сбрасывает сессию без спама ретраями. |
| **`611b928`** | 2026-09-04 | `fix(telegram)` | Добавлен скрипт Telegram WebApp в `index.html`, централизован хелпер `getTelegramInitData`. |
| **`3c75fbd`** | 2026-09-04 | `fix(auth)` | Улучшено извлечение `initData` из URL Search Params, Hash Params и с regex фоллбеком. |
| **`747f2be`** | 2026-09-04 | `fix(auth)` | `initData` сделана опциональной при логине, улучшены сообщения об ошибках. |
| **`b4a68fd`** | 2026-09-02 | `feat(ui)` | Кнопка-глазок для скрытия/показа пароля на странице `LoginPage`. |
| **`c2c55b1`** | 2026-09-02 | `fix(auth)` | Очистка `dev_mock` данных в проде, флаг `skipRetry` для быстрого входа. |
| **`dc6b425`** | 2026-08-29 | `fix(frontend)` | Разрешен Telegram Desktop и все разновидности Telegram WebViews в `App.jsx`. |
| **`2844215`** | 2026-08-27 | `feat(api)` | 3-секундный авто-повтор для сетевых и 5xx ошибок бэкенда Render. |
| **`5555126`** | 2026-08-27 | `fix(auth)` | Вызов `/auth/login-json` при отсутствии `initData` во избежание ошибки 422. |
| **`fff2106`** | 2026-08-27 | `fix(auth)` | Сохранение сессии в Telegram, предотвращение черного экрана при перезагрузке. |

---

## 💡 9. Инструкция для ИИ-агентов (Guidelines for AI Agents)

1. **Не сканируй весь проект зря:** сначала прочитай этот файл (особенно разделы 0, 4 и 6), при необходимости `USER_GUIDE.md` и `COMPLETE_API_DOCUMENTATION.md` в ветке `backend`.
2. **Учитывай оба окружения:** приложение работает и в Telegram Mini App (ограничения WebView и `window.Telegram.WebApp`), и в обычном браузере. Роутинг, всплывающие окна, скачивание файлов и авторизацию проверяй в обоих.
3. **Холодный старт Render:** логику повтора запросов в `src/services/api.js` не удалять.
4. **Изменения API делай синхронно:** бэкенд (ветка `backend`) + фронт (`frontend`) + тест (pytest / Vitest / Playwright). Не ломай e2e: `e2e/seed.py` и `e2e/smoke.spec.js`.
5. **Обновление этого файла:** при новых фичах, изменении архитектуры, роутов, API, переменных окружения или CI добавь строку в Changelog (раздел 8, сверху, с пометкой (F)/(B)) и поправь соответствующие разделы 0–7.

# Полная документация API системы дисциплины

## Обзор
Система предоставляет API для управления дисциплиной в школе с тремя типами пользователей: Админ, Учитель, Ученик.

---

## 🔐 Аутентификация

### `POST /auth/login`
**Универсальный вход (рекомендуемый)**

**Запрос:**
```json
{
  "username": "ivan_petrov",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "role": "student",
  "user_id": 1,
  "username": "ivan_petrov",
  "first_name": "Иван",
  "last_name": "Петров",
  "telegram_id": 123456789,
  "telegram_linked": true
}
```

### `POST /auth/login-form`
**Вход через форму (legacy)**

### `POST /auth/login-json`
**Вход через JSON**

### `POST /auth/telegram-login`
**Вход через Telegram**

### `GET /auth/me`
**Получить профиль текущего пользователя**

---

## 👨‍🎓 ЭНДПОЙНТЫ УЧЕНИКА

### **Основные (3 эндпойнта)**

#### `GET /students/me`
**Получить профиль ученика**

**Ответ:**
```json
{
  "id": 1,
  "telegram_id": 123456789,
  "username": "ivan_petrov",
  "first_name": "Иван",
  "last_name": "Петров",
  "points": 150,
  "school_class": {
    "id": 1,
    "name": "10А"
  }
}
```

#### `GET /students/me/history`
**Получить историю баллов ученика**

**Ответ:**
```json
[
  {
    "id": 1,
    "points_changed": 5,
    "comment": "Активная работа на уроке",
    "rule_name": "Активное участие в уроке",
    "created_at": "2024-01-15T14:30:00Z"
  }
]
```

#### `GET /students/leaderboard`
**Получить топ-5 учеников**

**Ответ:**
```json
[
  {
    "id": 1,
    "username": "ivan_petrov",
    "first_name": "Иван",
    "last_name": "Петров",
    "points": 150
  }
]
```

### **Рейтинг и статистика (4 эндпойнта)**

#### `GET /students/me/class-ranking`
**Место в классе**

**Ответ:**
```json
{
  "student_id": 1,
  "student_name": "Иван Петров",
  "points": 150,
  "rank": 3,
  "total_students_in_class": 25
}
```

#### `GET /students/me/overall-ranking`
**Общий рейтинг по школе**

**Ответ:**
```json
{
  "student_id": 1,
  "student_name": "Иван Петров",
  "student_class": "10А",
  "points": 150,
  "rank": 15,
  "total_students": 200
}
```

#### `GET /students/me/statistics`
**Полная статистика**

**Ответ:**
```json
{
  "current_points": 150,
  "class_rank": 3,
  "total_students_in_class": 25,
  "overall_rank": 15,
  "total_students": 200,
  "class_name": "10А",
  "points_above_class_average": 12.5,
  "points_above_overall_average": 8.3,
  "class_average": 137.5,
  "overall_average": 141.7
}
```

#### `GET /students/class/{class_id}/ranking`
**Рейтинг класса**

**Ответ:**
```json
[
  {
    "student_id": 1,
    "student_name": "Иван Петров",
    "points": 150,
    "rank": 1,
    "total_students_in_class": 25
  }
]
```

---

## 👨‍🏫 ЭНДПОЙНТЫ УЧИТЕЛЯ

### **Управление студентами (3 эндпойнта)**

#### `GET /teacher/students`
**Получить всех студентов**

**Ответ:**
```json
[
  {
    "id": 1,
    "telegram_id": 123456789,
    "username": "ivan_petrov",
    "first_name": "Иван",
    "last_name": "Петров",
    "points": 150,
    "school_class": {
      "id": 1,
      "name": "10А"
    }
  }
]
```

#### `GET /teacher/students/search?q=Иван`
**Поиск студентов по имени**

#### `GET /teacher/students/{student_id}`
**Получить детали студента**

### **История баллов (3 эндпойнта)**

#### `GET /teacher/me/history?page=1&size=20`
**Получить свою историю выставления баллов с пагинацией**

**Параметры запроса:**
- `page` (необязательный, по умолчанию 1): номер страницы
- `size` (необязательный, по умолчанию 20, максимум 100): количество элементов на странице

**Ответ:**
```json
{
  "items": [
    {
      "id": 1,
      "student_name": "Иван Петров",
      "student_class": "10А",
      "rule_description": "Активное участие в уроке",
      "points_changed": 5,
      "comment": "Отличная работа!",
      "created_at": "2024-01-15T14:30:00Z"
    }
  ],
  "total_count": 45,
  "page": 1,
  "size": 20,
  "total_pages": 3
}
```

#### `GET /teacher/me/history/{assignment_id}`
**Получить детали конкретного назначения баллов**

**Ответ:**
```json
{
  "id": 1,
  "student_name": "Иван Петров",
  "student_class": "10А",
  "rule_description": "Активное участие в уроке",
  "points_changed": 5,
  "comment": "Отличная работа!",
  "created_at": "2024-01-15T14:30:00Z",
  "can_delete": true
}
```

#### `DELETE /teacher/me/history/{history_id}`
**Удалить свое назначение баллов (с отменой баллов)**

### **Workflow - Режим 1: Студент → Правила (3 эндпойнта)**

#### `GET /teacher/workflow/classes`
**Получить все классы**

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "10А"
  }
]
```

#### `GET /teacher/workflow/classes/{class_id}/students`
**Получить студентов класса**

#### `GET /teacher/workflow/rules`
**Получить все правила**

**Ответ:**
```json
[
  {
    "id": 1,
    "description": "Активное участие в уроке",
    "points": 5
  }
]
```

### **Workflow - Режим 2: Правило → Классы → Студенты (3 эндпойнта)**

#### `GET /teacher/workflow/rule/{rule_id}/classes`
**Получить классы для правила**

**Ответ:**
```json
[
  {
    "id": 1,
    "name": "10А",
    "student_count": 25
  }
]
```

#### `GET /teacher/workflow/rule/{rule_id}/classes/{class_id}/students`
**Получить студентов для правила и класса**

### **Назначение баллов (3 эндпойнта)**

#### `POST /teacher/workflow/assign`
**Назначить баллы**

**Запрос:**
```json
{
  "student_ids": [1, 2, 3],
  "rule_ids": [1, 2],
  "comment": "Отличная работа на уроке!"
}
```

**Ответ:**
```json
{
  "message": "Points assigned successfully to 3 students using 2 rules.",
  "students_affected": 3,
  "rules_used": 2,
  "total_points": 15
}
```

#### `GET /teacher/workflow/state`
**Получить состояние workflow**

#### `POST /teacher/workflow/state`
**Обновить состояние workflow**

---

## 👨‍💼 ЭНДПОЙНТЫ АДМИНА

### **Управление правилами дисциплины (4 эндпойнта)**

#### `POST /admin/rules`
**Создать правило**

**Запрос:**
```json
{
  "description": "Активное участие в уроке",
  "points": 5
}
```

**Ответ:**
```json
{
  "id": 1,
  "description": "Активное участие в уроке",
  "points": 5
}
```

#### `GET /admin/rules`
**Получить все правила**

#### `GET /admin/rules/{rule_id}`
**Получить правило по ID**

#### `PUT /admin/rules/{rule_id}`
**Обновить правило**

#### `DELETE /admin/rules/{rule_id}`
**Удалить правило**

### **Управление учителями (4 эндпойнта)**

#### `POST /admin/teachers`
**Создать учителя**

**Запрос:**
```json
{
  "username": "teacher1",
  "first_name": "Анна",
  "last_name": "Смирнова",
  "password": "password123"
}
```

#### `GET /admin/teachers`
**Получить всех учителей**

#### `GET /admin/teachers/{teacher_id}`
**Получить учителя по ID**

#### `PUT /admin/teachers/{teacher_id}`
**Обновить учителя**

#### `DELETE /admin/teachers/{teacher_id}`
**Удалить учителя**

### **Управление учениками (6 эндпойнтов)**

#### `POST /admin/students`
**Создать ученика**

**Запрос:**
```json
{
  "username": "ivan_petrov",
  "first_name": "Иван",
  "last_name": "Петров",
  "password": "password123",
  "class_name": "10А"
}
```

#### `GET /admin/students`
**Получить всех учеников**

**Ответ:**
```json
[
  {
    "id": 1,
    "telegram_id": 123456789,
    "username": "ivan_petrov",
    "first_name": "Иван",
    "last_name": "Петров",
    "points": 150,
    "school_class": {
      "id": 1,
      "name": "10А"
    }
  }
]
```

#### `GET /admin/students/class/{class_id}`
**Получить учеников по классу**

#### `GET /admin/students/{student_id}`
**Получить ученика по ID**

#### `PUT /admin/students/{student_id}`
**Обновить ученика**

#### `DELETE /admin/students/{student_id}`
**Удалить ученика**

### **Управление классами (6 эндпойнтов)**

#### `POST /admin/classes`
**Создать класс**

**Запрос:**
```json
{
  "name": "10А"
}
```

#### `GET /admin/classes`
**Получить все классы**

#### `GET /admin/classes/{class_id}`
**Получить класс по ID**

#### `GET /admin/classes/search/{class_name}`
**Найти класс по имени**

#### `GET /admin/classes/{class_id}/students`
**Получить учеников класса**

#### `PUT /admin/classes/{class_id}`
**Обновить класс**

#### `DELETE /admin/classes/{class_id}`
**Удалить класс**

### **Модерация (2 эндпойнта)**

#### `GET /admin/history`
**Получить всю историю баллов**

**Ответ:**
```json
[
  {
    "id": 1,
    "student_id": 1,
    "teacher_id": 1,
    "rule_id": 1,
    "points_changed": 5,
    "comment": "Отличная работа!",
    "created_at": "2024-01-15T14:30:00Z"
  }
]
```

#### `DELETE /admin/history/{history_id}`
**Удалить запись истории (с отменой баллов)**

### **Статистика (1 эндпойнт)**

#### `GET /admin/stats/teachers`
**Получить статистику учителей**

**Ответ:**
```json
[
  {
    "teacher_id": 1,
    "first_name": "Анна",
    "last_name": "Смирнова",
    "positive_assignments": 25,
    "negative_assignments": 5
  }
]
```

---

## 📊 ПРИМЕРЫ ДАННЫХ

### **Правила дисциплины**
```json
[
  {
    "id": 1,
    "description": "Активное участие в уроке",
    "points": 5
  },
  {
    "id": 2,
    "description": "Помощь одноклассникам",
    "points": 3
  },
  {
    "id": 3,
    "description": "Отличная домашняя работа",
    "points": 10
  },
  {
    "id": 4,
    "description": "Опоздание на урок",
    "points": -5
  },
  {
    "id": 5,
    "description": "Нарушение дисциплины",
    "points": -10
  }
]
```

### **Классы**
```json
[
  {
    "id": 1,
    "name": "6А"
  },
  {
    "id": 2,
    "name": "6Б"
  },
  {
    "id": 3,
    "name": "10А"
  },
  {
    "id": 4,
    "name": "11Б"
  }
]
```

### **Учителя**
```json
[
  {
    "id": 1,
    "username": "teacher1",
    "first_name": "Анна",
    "last_name": "Смирнова",
    "telegram_id": 987654321
  },
  {
    "id": 2,
    "username": "teacher2",
    "first_name": "Петр",
    "last_name": "Иванов",
    "telegram_id": 987654322
  }
]
```

### **Ученики**
```json
[
  {
    "id": 1,
    "username": "ivan_petrov",
    "first_name": "Иван",
    "last_name": "Петров",
    "points": 150,
    "school_class": {
      "id": 3,
      "name": "10А"
    },
    "telegram_id": 123456789
  },
  {
    "id": 2,
    "username": "maria_kozлова",
    "first_name": "Мария",
    "last_name": "Козлова",
    "points": 180,
    "school_class": {
      "id": 3,
      "name": "10А"
    },
    "telegram_id": 123456790
  }
]
```

---

## 🔒 БЕЗОПАСНОСТЬ

### **Аутентификация**
- Все эндпойнты требуют Bearer токен (кроме `/auth/*` и `/admin-registration/*`)
- Токены действительны 24 часа
- Поддержка Telegram WebApp аутентификации

### **Авторизация**
- **Ученики**: Доступ только к своим данным и рейтингам
- **Учителя**: Доступ к студентам и назначению баллов
- **Админы**: Полный доступ ко всем данным

### **Валидация**
- Все входные данные валидируются через Pydantic
- Проверка существования связанных записей
- Транзакционность критических операций

---

## 📈 ИТОГОВАЯ СТАТИСТИКА

### **Всего эндпойнтов: 50+**

- **Аутентификация**: 4 эндпойнта
- **Ученики**: 7 эндпойнтов
- **Учителя**: 11 эндпойнтов
- **Админы**: 30+ эндпойнтов

### **Основные функции**
- ✅ Управление пользователями (CRUD)
- ✅ Система баллов и рейтингов
- ✅ История изменений
- ✅ Модерация и статистика
- ✅ Два режима назначения баллов
- ✅ Telegram интеграция

---

## 🚀 РЕКОМЕНДАЦИИ ПО ИСПОЛЬЗОВАНИЮ

### **Для фронтенда**
1. Используйте `/auth/login` для аутентификации
2. Сохраняйте токен в localStorage
3. Добавляйте заголовок `Authorization: Bearer <token>`
4. Обрабатывайте ошибки 401/403 для перенаправления на логин

### **Для мобильного приложения**
1. Используйте Telegram WebApp аутентификацию
2. Кэшируйте данные для офлайн работы
3. Реализуйте pull-to-refresh для обновления данных

### **Для администрирования**
1. Начните с создания классов
2. Создайте правила дисциплины
3. Добавьте учителей
4. Импортируйте учеников с привязкой к классам


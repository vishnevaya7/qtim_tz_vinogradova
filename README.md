# ТЗ QTIM Articles Management API

REST API на NestJS для управления статьями. Проект включает в себя авторизацию, фильтрацию, пагинацию и через Redis.

---

## Основные возможности
- **Auth:** Регистрация и логин с использованием JWT и Bcrypt.
- **Articles CRUD:** Полный цикл управления статьями (создание, чтение, обновление, удаление).
- **Caching (Redis):** Кэширование списков статей.
- **Invalidation:** Автоматическая очистка кэша при любом изменении данных.
- **Validation:** Строгая валидация входящих данных через DTO (class-validator).
- **Documentation:** Автогенерация документации через Swagger.

---

## Технологический стек
* **Framework:** NestJS
* **Database:** PostgreSQL (TypeORM)
* **Cache:** Redis (Cache-manager + Keyv)
* **Docs:** Swagger UI
* **Dev Tools:** Docker & Docker Compose

---

## Установка и запуск

### 1. Настройка переменных окружения
Найдите файл `.env` в корне проекта и заполните его:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=testdb
DB_SCHEMA=qtim

# Auth
JWT_SECRET=supersecret

# Redis
REDIS_URL=redis://localhost:6379
```

## Запуск инфраструктуры

Запустите базу данных и Redis через Docker:

```
docker-compose up -d
```

## Запуск приложения


```
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run start:dev
```

## Тестирование и проверка
После запуска проект доступен по адресу:
http://localhost:3000/api


Файл для быстрых тестов
В корне проекта находится файл api-test.http. Его можно запустить напрямую из WebStorm или VS Code для быстрой проверки всех эндпоинтов (Auth, CRUD, Cache).

Проверка Redis (CLI)
Чтобы убедиться, что кэш работает, выполните:
```
# Вход в консоль Redis
docker exec -it <имя контейнера redis>

# Просмотр всех ключей кэша
KEYS*
```

## Структура API

* **POST /auth/register** — регистрация нового пользователя.
* **POST /auth/login** — аутентификация и получение JWT-токена.
* **GET /articles** — получение списка статей.
  Параметры: page, limit, authorId, publishedAfter.

* **GET /articles/:id** — получение одной статьи по ID.
* **POST /articles** — создание статьи (нужен Bearer токен).
* **PATCH /articles/:id** — частичное редактирование (только для автора).
* **DELETE /articles/:id** — удаление статьи (только для автора).


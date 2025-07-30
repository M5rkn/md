# 🏥 Медицинский агрегатор | Backend API

Серверная часть медицинского агрегатора с ИИ-анализом и рекомендациями БАДов.

## 🚀 Быстрый старт

### 📋 Требования

- **Node.js** 18+
- **PostgreSQL** 14+
- **Redis** 6+ (опционально для кеширования)

### ⚙️ Установка и настройка

1. **Установка зависимостей**
```bash
npm install
```

2. **Настройка окружения**
```bash
cp .env.example .env
```

Отредактируйте `.env` файл:
```env
# База данных PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/medical_aggregator"

# JWT секреты
JWT_ACCESS_SECRET="your-access-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Redis для кеширования (опционально)
REDIS_URL="redis://localhost:6379"

# OpenAI для ИИ-анализа
OPENAI_API_KEY="your-openai-api-key"

# Настройки сервера
PORT=5000
NODE_ENV=development
```

3. **Настройка базы данных**

```bash
# Генерация Prisma клиента
npm run db:generate

# Применение миграций
npm run db:migrate

# Заполнение тестовыми данными
npm run db:seed

# Или выполнить все сразу
npm run db:setup
```

4. **Запуск сервера**
```bash
# Разработка с hot-reload
npm run dev

# Продакшн
npm run build
npm start
```

## 🗄️ База данных

### SQL Таблицы

Структура PostgreSQL базы данных:

- **`users`** - Пользователи системы
  - `id`, `name`, `email`, `password`, `role`, `created_at`, `updated_at`
  
- **`forms`** - Медицинские анкеты
  - `id`, `user_id`, `answers` (JSON), `created_at`, `updated_at`
  
- **`files`** - Загруженные медицинские документы
  - `id`, `form_id`, `filename`, `path`, `mimetype`, `size`, `uploaded_at`
  
- **`supplements`** - Каталог БАДов
  - `id`, `name`, `price`, `description`, `tags[]`, `in_stock`, `created_at`, `updated_at`
  
- **`recommendations`** - ИИ-рекомендации
  - `id`, `form_id`, `name`, `dose`, `duration`, `description`, `confidence`, `created_at`
  
- **`orders`** - Заказы пользователей
  - `id`, `user_id`, `items` (JSON), `total_price`, `delivery_info` (JSON), `status`, `created_at`, `updated_at`

### Prisma модели

TypeScript модели для работы с базой данных:

- **`UserModel`** - Управление пользователями с хешированием паролей
- **`FormModel`** - Медицинские анкеты с валидацией структуры
- **`SupplementModel`** - Каталог БАДов с поиском и фильтрацией
- **`RecommendationModel`** - ИИ-рекомендации с оценкой уверенности
- **`OrderModel`** - Заказы с валидацией товаров и доставки
- **`FileModel`** - Загруженные файлы с проверкой типов

### Команды базы данных

```bash
# Prisma Studio - веб интерфейс для БД
npm run db:studio

# Генерация Prisma клиента
npm run db:generate

# Создание новой миграции
npm run db:migrate

# Применение миграций в продакшн
npm run db:migrate:deploy

# Сброс БД с потерей данных
npm run db:reset

# Заполнение тестовыми данными
npm run db:seed

# Полная настройка БД
npm run db:setup
```

## 📡 API Endpoints

### 🔐 Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена
- `POST /api/auth/logout` - Выход

### 👤 Пользователи
- `GET /api/users/profile` - Профиль текущего пользователя
- `PUT /api/users/profile` - Обновление профиля
- `GET /api/users/stats` - Статистика пользователя

### 📋 Медицинские анкеты
- `POST /api/forms` - Создание анкеты
- `GET /api/forms` - Получение анкет пользователя
- `GET /api/forms/:id` - Получение анкеты по ID
- `PUT /api/forms/:id` - Обновление анкеты
- `DELETE /api/forms/:id` - Удаление анкеты

### 📎 Файлы
- `POST /api/files/upload` - Загрузка файла
- `GET /api/files/:id` - Скачивание файла
- `GET /api/forms/:formId/files` - Файлы анкеты
- `DELETE /api/files/:id` - Удаление файла

### 💊 Каталог БАДов
- `GET /api/supplements` - Получение каталога
- `GET /api/supplements/:id` - Получение БАДа по ID
- `GET /api/supplements/search` - Поиск БАДов
- `GET /api/supplements/tags` - Получение всех тегов

### 🤖 ИИ-рекомендации
- `POST /api/recommendations/analyze` - Анализ анкеты
- `GET /api/forms/:formId/recommendations` - Рекомендации для анкеты
- `GET /api/recommendations/:id` - Получение рекомендации

### 🛒 Заказы
- `POST /api/orders` - Создание заказа
- `GET /api/orders` - Получение заказов пользователя
- `GET /api/orders/:id` - Получение заказа по ID
- `PUT /api/orders/:id/status` - Обновление статуса заказа

### 📊 Администрирование (роль ADMIN)
- `GET /api/admin/users` - Управление пользователями
- `GET /api/admin/forms` - Все анкеты
- `GET /api/admin/orders` - Управление заказами
- `GET /api/admin/stats` - Статистика системы

## 🏗️ Архитектура проекта

```
server/src/
├── controllers/        # Контроллеры API
├── middleware/        # Промежуточное ПО
├── models/           # Prisma модели
├── routes/           # Маршруты API
├── services/         # Бизнес-логика
├── utils/            # Утилиты
├── database/         # БД миграции и сиды
├── types/            # TypeScript типы
└── server.ts         # Точка входа
```

### 🔧 Ключевые компоненты

- **Prisma ORM** - Работа с PostgreSQL
- **JWT аутентификация** - Access/Refresh токены
- **Multer** - Загрузка файлов
- **Joi/Yup** - Валидация данных
- **Winston** - Логирование
- **Helmet** - Безопасность
- **Rate Limiting** - Защита от спама

## 🧪 Тестирование

```bash
# Запуск тестов
npm test

# Тесты с покрытием
npm run test:coverage

# Тесты в watch режиме
npm run test:watch
```

## 🔒 Безопасность

- **Хеширование паролей** bcryptjs
- **JWT токены** с ротацией
- **Rate limiting** защита от брутфорса
- **Helmet.js** заголовки безопасности
- **Валидация входных данных**
- **CORS** политики
- **Загрузка файлов** с проверкой типов

## 📦 Развертывание

### Docker

```bash
# Сборка образа
docker build -t medical-aggregator-server .

# Запуск с базой данных
docker-compose up -d
```

### Переменные окружения для продакшн

```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:pass@db:5432/medical_aggregator"
JWT_ACCESS_SECRET="production-access-secret"
JWT_REFRESH_SECRET="production-refresh-secret"
REDIS_URL="redis://redis:6379"
OPENAI_API_KEY="your-production-openai-key"
```

## 🤖 ИИ-анализ

Система использует:
- **OpenAI GPT-4** для анализа медицинских анкет
- **Rule-based логика** как fallback
- **Scoring система** для оценки уверенности
- **Кеширование** результатов анализа

## 📈 Мониторинг

- **Winston логи** в файлы и консоль
- **System logs** таблица для отслеживания
- **Health check** endpoint
- **Метрики производительности**

## 🗃️ Тестовые данные

После выполнения `npm run db:seed` будут созданы:

**Пользователи:**
- Админ: `admin@medical-aggregator.ru` / `admin123`
- Доктор: `doctor@medical-aggregator.ru` / `user123`  
- Пользователь: `user@example.com` / `user123`

**Каталог БАДов:**
- Витамин D3 1000 МЕ - 299₽
- Омега-3 EPA/DHA - 899₽
- Магний Бисглицинат - 599₽
- Пробиотик Комплекс - 1299₽
- Коэнзим Q10 - 1599₽

## 🤝 Разработка

### Стиль кода

```bash
# Линтинг
npm run lint

# Форматирование
npm run format

# Проверка типов
npm run type-check
```

### Git Hooks

Настроены pre-commit хуки для:
- ESLint проверки
- Prettier форматирования  
- TypeScript компиляции
- Тестов

## 📞 Поддержка

- **Email:** support@medical-aggregator.ru
- **Телефон:** +7 (800) 555-01-23
- **Документация API:** http://localhost:5000/api/docs (Swagger)

---

**⚕️ Медицинский агрегатор** - надежное решение для персональных рекомендаций БАДов на основе ИИ-анализа. 
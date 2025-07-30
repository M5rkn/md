# 🗄️ Настройка базы данных - Медицинский агрегатор

Полная инструкция по развертыванию PostgreSQL базы данных для медицинского агрегатора.

## 🚀 Быстрый старт

### 1. Создание базы данных

```sql
-- Подключение к PostgreSQL как superuser
sudo -u postgres psql

-- Создание пользователя и базы данных
CREATE USER medical_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE medical_aggregator OWNER medical_user;
GRANT ALL PRIVILEGES ON DATABASE medical_aggregator TO medical_user;

-- Выход из psql
\q
```

### 2. Настройка переменных окружения

```bash
# server/.env
DATABASE_URL="postgresql://medical_user:your_secure_password@localhost:5432/medical_aggregator"
```

### 3. Выполнение миграций

```bash
cd server/

# Генерация Prisma клиента
npm run db:generate

# Применение миграций
npm run db:migrate

# Заполнение тестовыми данными
npm run db:seed
```

## 📋 SQL схема таблиц

### Основные таблицы

```sql
-- Пользователи системы
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Медицинские анкеты
CREATE TABLE "forms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Каталог БАДов
CREATE TABLE "supplements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- ИИ-рекомендации
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "form_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "description" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE
);

-- Заказы пользователей
CREATE TABLE "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "delivery_info" JSONB NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
);

-- Загруженные файлы
CREATE TABLE "files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "form_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE
);
```

## 🔧 Prisma модели

### User.ts - Управление пользователями
```typescript
import { UserModel } from '@/models/User';

// Создание пользователя
const user = await UserModel.create({
  name: 'Иван Иванов',
  email: 'ivan@example.com',
  password: 'securePassword123',
  role: 'USER'
});

// Поиск по email
const existingUser = await UserModel.findByEmail('ivan@example.com');

// Верификация пароля
const isValid = await UserModel.verifyPassword(user, 'securePassword123');
```

### Form.ts - Медицинские анкеты
```typescript
import { FormModel } from '@/models/Form';

// Создание анкеты
const form = await FormModel.create({
  userId: user.id,
  answers: {
    personalInfo: {
      age: 30,
      gender: 'male',
      weight: 75,
      height: 180,
      activityLevel: 'moderate'
    },
    medicalInfo: {
      chronicDiseases: ['гипертония'],
      currentMedications: ['лизиноприл'],
      allergies: []
    },
    // ... остальные данные
  }
});
```

### Supplement.ts - Каталог БАДов
```typescript
import { SupplementModel } from '@/models/Supplement';

// Поиск БАДов
const supplements = await SupplementModel.findMany(1, 20, {
  search: 'витамин',
  tags: ['иммунитет'],
  priceRange: { min: 100, max: 1000 },
  inStock: true
});
```

### Order.ts - Заказы
```typescript
import { OrderModel } from '@/models/Order';

// Создание заказа
const order = await OrderModel.create({
  userId: user.id,
  items: [
    {
      supplementId: 'vitamin-d3-1000',
      name: 'Витамин D3 1000 МЕ',
      price: 299.00,
      quantity: 2
    }
  ],
  deliveryInfo: {
    address: {
      city: 'Москва',
      street: 'ул. Ленина',
      building: '1',
      postalCode: '101000'
    },
    phone: '+7 999 123-45-67',
    email: 'user@example.com',
    deliveryMethod: 'courier'
  }
});
```

## 📊 Команды для работы с БД

### Основные команды
```bash
# Prisma Studio - веб-интерфейс для БД
npm run db:studio

# Генерация клиента после изменения схемы
npm run db:generate

# Создание и применение миграции
npm run db:migrate

# Применение миграций в продакшн (без dev флага)
npm run db:migrate:deploy

# Сброс БД и применение всех миграций заново
npm run db:migrate:reset

# Заполнение БД тестовыми данными
npm run db:seed

# Полная настройка БД с нуля
npm run db:setup

# Сброс БД и пересоздание с тестовыми данными
npm run db:reset
```

### Работа с миграциями
```bash
# Создание новой миграции
npx prisma migrate dev --name add_user_table

# Применение pending миграций
npx prisma migrate deploy

# Просмотр статуса миграций
npx prisma migrate status
```

## 🔍 Полезные SQL запросы

### Статистика пользователей
```sql
SELECT 
  role,
  COUNT(*) as count,
  DATE_TRUNC('month', created_at) as month
FROM users 
GROUP BY role, DATE_TRUNC('month', created_at)
ORDER BY month DESC;
```

### Популярные БАДы в рекомендациях
```sql
SELECT 
  name,
  COUNT(*) as recommendations_count,
  AVG(confidence) as avg_confidence
FROM recommendations 
GROUP BY name 
ORDER BY recommendations_count DESC 
LIMIT 10;
```

### Статистика заказов
```sql
SELECT 
  status,
  COUNT(*) as orders_count,
  SUM(total_price) as total_revenue
FROM orders 
GROUP BY status;
```

## 🗃️ Тестовые данные

После выполнения `npm run db:seed` будут созданы:

### Пользователи
- **Админ**: `admin@medical-aggregator.ru` / `admin123`
- **Доктор**: `doctor@medical-aggregator.ru` / `user123`
- **Пользователь**: `user@example.com` / `user123`

### БАДы в каталоге
- Витамин D3 1000 МЕ - 299₽
- Омега-3 EPA/DHA 1000 мг - 899₽
- Магний Бисглицинат 200 мг - 599₽
- Пробиотик Комплекс 50 млрд КОЕ - 1299₽
- Коэнзим Q10 Убихинол 100 мг - 1599₽

### Тестовые данные включают
- 1 заполненная медицинская анкета
- 3 ИИ-рекомендации с разной уверенностью
- 1 тестовый заказ со статусом "CONFIRMED"
- Системные настройки приложения

## 🔧 Резервное копирование

### Создание бэкапа
```bash
pg_dump -h localhost -U medical_user -d medical_aggregator > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Восстановление из бэкапа
```bash
psql -h localhost -U medical_user -d medical_aggregator < backup_20240128_120000.sql
```

## 🚨 Устранение проблем

### Проблема с подключением к БД
```bash
# Проверка статуса PostgreSQL
sudo systemctl status postgresql

# Перезапуск PostgreSQL
sudo systemctl restart postgresql

# Проверка подключения
psql -h localhost -U medical_user -d medical_aggregator -c "SELECT 1;"
```

### Проблемы с миграциями
```bash
# Сброс состояния миграций
npx prisma migrate reset

# Принудительное применение миграций
npx prisma db push --force-reset
```

### Проблемы с правами доступа
```sql
-- Предоставление всех прав пользователю
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO medical_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO medical_user;
```

## 📚 Дополнительные ресурсы

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQL Migrations Best Practices](https://www.prisma.io/docs/guides/database/migrations)

---

**Успешной настройки базы данных для медицинского агрегатора! 🎉** 
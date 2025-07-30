-- Создание таблиц для медицинского агрегатора
-- Миграция 001: Создание базовой схемы

-- Роли пользователей
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'DOCTOR', 'MODERATOR');

-- Статусы заказов
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- Пользователи системы
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Сессии пользователей
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- Медицинские анкеты/формы
CREATE TABLE "forms" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forms_pkey" PRIMARY KEY ("id")
);

-- Загруженные файлы (медицинские документы)
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- Каталог БАДов и добавок
CREATE TABLE "supplements" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "tags" TEXT[],
    "in_stock" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplements_pkey" PRIMARY KEY ("id")
);

-- ИИ-рекомендации по БАДам
CREATE TABLE "recommendations" (
    "id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "description" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- Заказы пользователей
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "delivery_info" JSONB NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- Системные логи
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_logs_pkey" PRIMARY KEY ("id")
);

-- Настройки системы
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- Создание уникальных индексов
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "user_sessions_refresh_token_key" ON "user_sessions"("refresh_token");
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- Добавление внешних ключей
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "forms" ADD CONSTRAINT "forms_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "files" ADD CONSTRAINT "files_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Создание индексов для оптимизации
CREATE INDEX "forms_user_id_idx" ON "forms"("user_id");
CREATE INDEX "forms_created_at_idx" ON "forms"("created_at");
CREATE INDEX "files_form_id_idx" ON "files"("form_id");
CREATE INDEX "supplements_tags_idx" ON "supplements" USING GIN("tags");
CREATE INDEX "supplements_in_stock_idx" ON "supplements"("in_stock");
CREATE INDEX "recommendations_form_id_idx" ON "recommendations"("form_id");
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at");
CREATE INDEX "system_logs_level_idx" ON "system_logs"("level");
CREATE INDEX "system_logs_created_at_idx" ON "system_logs"("created_at");

-- Вставка начальных данных
INSERT INTO "system_settings" ("id", "key", "value", "updated_at") VALUES
('1', 'app_name', 'Медицинский агрегатор', CURRENT_TIMESTAMP),
('2', 'app_version', '1.0.0', CURRENT_TIMESTAMP),
('3', 'ai_model_version', 'gpt-4-turbo', CURRENT_TIMESTAMP),
('4', 'max_file_size', '10485760', CURRENT_TIMESTAMP), -- 10MB
('5', 'allowed_file_types', 'pdf,jpg,jpeg,png,doc,docx', CURRENT_TIMESTAMP);

-- Примеры БАДов в каталоге
INSERT INTO "supplements" ("id", "name", "price", "description", "tags", "created_at", "updated_at") VALUES
('1', 'Витамин D3 1000 МЕ', 299.00, 'Поддерживает здоровье костей и иммунной системы. Рекомендуется при дефиците витамина D.', ARRAY['витамин d', 'иммунитет', 'кости'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2', 'Омега-3 EPA/DHA', 899.00, 'Полиненасыщенные жирные кислоты для здоровья сердца и мозга. Высокая концентрация EPA и DHA.', ARRAY['омега-3', 'сердце', 'мозг'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('3', 'Магний Бисглицинат 200 мг', 599.00, 'Хелатная форма магния с высокой биодоступностью. Поддерживает нервную систему и мышцы.', ARRAY['магний', 'нервы', 'мышцы', 'сон'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('4', 'Пробиотик Лактобифадол', 1299.00, 'Комплекс полезных бактерий для здоровья кишечника. 10 штаммов, 20 млрд КОЕ.', ARRAY['пробиотик', 'пищеварение', 'кишечник'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('5', 'Коэнзим Q10 100 мг', 1599.00, 'Мощный антиоксидант для энергии клеток и здоровья сердца. Убихинол форма.', ARRAY['q10', 'энергия', 'антиоксидант', 'сердце'], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

COMMENT ON TABLE "users" IS 'Пользователи медицинского агрегатора';
COMMENT ON TABLE "forms" IS 'Медицинские анкеты с ответами пользователей';
COMMENT ON TABLE "files" IS 'Загруженные медицинские документы и анализы';
COMMENT ON TABLE "supplements" IS 'Каталог БАДов и пищевых добавок';
COMMENT ON TABLE "recommendations" IS 'ИИ-рекомендации персональных БАДов';
COMMENT ON TABLE "orders" IS 'Заказы пользователей на БАДы'; 
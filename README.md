# 🏥 Медицинский агрегатор с консультациями

Сайт для записи на персональные консультации с врачом-нутрициологом. Первая консультация всего за 1 рубль!

## 🏗️ Архитектура проекта

Проект состоит из трёх основных компонентов:

- **`client/`** - Frontend на React с современным UI
- **`server/`** - Backend API на Node.js + Express  
- **`ai-analyzer/`** - ИИ-микросервис на FastAPI для анализа анкет

## 🚀 Инструкция по запуску

### 📋 Предварительные требования

- **Node.js 18+**
- **Python 3.13+**
- **PostgreSQL 14+**
- **Redis** (для кэширования)
- **npm** и **pip3**

### 🔧 Установка зависимостей

1. **Клонирование репозитория**
```bash
git clone <repository-url>
cd rabotaa
```

2. **Установка всех зависимостей**
```bash
# Установка зависимостей для всех сервисов
npm run install:all
```

3. **Установка Python зависимостей**
```bash
cd ai-analyzer
python3 -m venv venv
source venv/bin/activate  # На macOS/Linux
# или
venv\Scripts\activate     # На Windows
pip3 install -r requirements.txt
```

### 🗄️ Настройка базы данных

1. **Установка PostgreSQL**
```bash
# macOS (через Homebrew)
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

2. **Создание базы данных**
```bash
# Подключение к PostgreSQL
psql postgres

# Создание пользователя и базы данных
CREATE USER medical_user WITH PASSWORD 'medical_password';
CREATE DATABASE medical_aggregator OWNER medical_user;
GRANT ALL PRIVILEGES ON DATABASE medical_aggregator TO medical_user;
\q
```

3. **Запуск миграций**
```bash
cd server
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 🔄 Настройка Redis

```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### ⚙️ Конфигурация переменных окружения

1. **Backend (.env)**
```bash
cd server
cp .env.example .env
```

Настройте в `server/.env`:
```env
DATABASE_URL="postgresql://medical_user:medical_password@localhost:5432/medical_aggregator"
JWT_SECRET="your-secret-key"
PORT=3001
```

2. **AI Analyzer (.env)**
```bash
cd ai-analyzer
cp .env.example .env
```

Настройте в `ai-analyzer/.env`:
```env
DATABASE_URL="postgresql://medical_user:medical_password@localhost:5432/medical_aggregator"
REDIS_URL="redis://localhost:6379"
DEEPSEEK_API_KEY="your-deepseek-api-key"
OPENAI_API_KEY="your-openai-api-key"
```

3. **Frontend (.env)**
```bash
cd client
cp .env.example .env
```

Настройте в `client/.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_AI_API_URL=http://localhost:8000
```

### 🚀 Запуск проекта

#### Вариант 1: Запуск всех сервисов одновременно

```bash
# Из корня проекта
npm run start:all
```

#### Вариант 2: Пошаговый запуск

1. **Запуск Backend сервера**
```bash
cd server
npm run dev
# Сервер запустится на http://localhost:3001
```

2. **Запуск AI Analyzer**
```bash
cd ai-analyzer
source venv/bin/activate
python main.py
# Сервис запустится на http://localhost:8000
```

3. **Запуск Frontend клиента**
```bash
cd client
npm start
# Приложение откроется на http://localhost:3000
```

### 🌐 Запуск на сервере (для доступа из сети)

1. **Получите IP адрес сервера**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# или
hostname -I
```

2. **Обновите переменные окружения**
```bash
# В client/.env
REACT_APP_API_URL=http://YOUR_SERVER_IP:3001/api
REACT_APP_AI_API_URL=http://YOUR_SERVER_IP:8000
```

3. **Запустите сервисы**
```bash
npm run start:all
```

4. **Доступ к приложению**
- Frontend: `http://YOUR_SERVER_IP:3000`
- Backend API: `http://YOUR_SERVER_IP:3001`
- AI Service: `http://YOUR_SERVER_IP:8000`

### 🔍 Проверка работоспособности

```bash
# Проверка Backend
curl http://localhost:3001/health

# Проверка AI Service
curl http://localhost:8000/api/v1/health

# Проверка Frontend
curl http://localhost:3000
```

### 🧪 Тестирование авторизации

```bash
# Регистрация пользователя
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## 📁 Структура проекта

```
rabotaa/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/  # React компоненты
│   │   ├── pages/       # Страницы приложения
│   │   ├── hooks/       # React хуки
│   │   └── services/    # API сервисы
│   └── public/          # Статические файлы
├── server/          # Node.js backend
│   ├── src/
│   │   ├── routes/      # API маршруты
│   │   ├── models/      # Модели данных
│   │   ├── middleware/  # Middleware
│   │   └── services/    # Бизнес-логика
│   └── database/        # Миграции и схема БД
├── ai-analyzer/     # FastAPI ИИ-сервис
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Конфигурация
│   │   ├── database/    # Работа с БД
│   │   └── services/    # ИИ-логика
│   └── requirements.txt # Python зависимости
├── docker-compose.yml   # Docker конфигурация
└── README.md
```

## 🛠️ Разработка

### Технологический стек

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS
- React Router
- Axios
- Formik + Yup

**Backend:**
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- JWT аутентификация
- Redis для кэширования
- Rate limiting

**ИИ-сервис:**
- FastAPI + Python 3.13
- DeepSeek API / OpenAI API
- PostgreSQL
- Redis кэширование

### 📝 Полезные команды

```bash
# Установка всех зависимостей
npm run install:all

# Запуск всех сервисов
npm run start:all

# Остановка всех процессов
pkill -f "react-scripts"
pkill -f "python.*main.py"
pkill -f "nodemon"

# Очистка кэша
cd client && rm -rf node_modules/.cache
cd server && rm -rf node_modules/.cache

# Перезапуск с очисткой
npm run clean:all && npm run install:all && npm run start:all
```

### 🔧 Отладка

1. **Проверка логов**
```bash
# Backend логи
tail -f server/logs/app.log

# AI Service логи
tail -f ai-analyzer/logs/app.log
```

2. **Проверка портов**
```bash
# Проверка занятых портов
lsof -i :3000  # Frontend
lsof -i :3001  # Backend
lsof -i :8000  # AI Service
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

3. **Проверка базы данных**
```bash
psql -U medical_user -d medical_aggregator
# Просмотр таблиц
\dt
# Просмотр пользователей
SELECT * FROM "User";
```

## 🚨 Устранение неполадок

### Частые проблемы

1. **"Module not found" ошибки**
```bash
# Переустановка зависимостей
rm -rf node_modules package-lock.json
npm install
```

2. **Ошибки подключения к БД**
```bash
# Проверка PostgreSQL
brew services restart postgresql
# Проверка подключения
psql -U medical_user -d medical_aggregator
```

3. **CORS ошибки**
- Проверьте настройки CORS в `server/src/server.ts`
- Убедитесь, что URL в `.env` файлах корректные

4. **Проблемы с Python**
```bash
# Пересоздание виртуального окружения
cd ai-analyzer
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи сервисов
2. Убедитесь, что все зависимости установлены
3. Проверьте настройки в `.env` файлах
4. Перезапустите все сервисы

**Проект готов к использованию!** 🚀 


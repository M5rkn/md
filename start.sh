#!/bin/bash

echo "🚀 Запуск медицинского агрегатора..."

# Проверяем наличие Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js 18+"
    exit 1
fi

# Проверяем наличие Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 не установлен. Установите Python 3.13+"
    exit 1
fi

# Проверяем наличие PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL не установлен. Установите PostgreSQL 14+"
    exit 1
fi

echo "✅ Все зависимости установлены"

# Устанавливаем зависимости для всех сервисов
echo "📦 Установка зависимостей..."
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..

# Устанавливаем Python зависимости
echo "🐍 Установка Python зависимостей..."
cd ai-analyzer
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip3 install -r requirements.txt
cd ..

# Запускаем миграции
echo "🗄️ Запуск миграций базы данных..."
cd server
npx prisma generate
npx prisma migrate deploy
cd ..

# Запускаем все сервисы
echo "🚀 Запуск всех сервисов..."
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "AI Service: http://localhost:8000"

# Запускаем сервисы в фоне
cd server && npm run dev &
cd ../ai-analyzer && source venv/bin/activate && python main.py &
cd ../client && npm start &

echo "✅ Все сервисы запущены!"
echo "Откройте http://localhost:3000 в браузере"

# Ждем завершения
wait 
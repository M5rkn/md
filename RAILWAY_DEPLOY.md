# 🚀 Деплой на Railway.com

## 📋 Подготовка к деплою

### 1. Создание аккаунта на Railway
1. Зайдите на [railway.app](https://railway.app)
2. Создайте аккаунт через GitHub
3. Подключите ваш GitHub репозиторий

### 2. Настройка переменных окружения

#### Для Backend сервера:
```env
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3001
NODE_ENV=production
CLIENT_URL=https://your-client-domain.railway.app
```

#### Для AI сервиса:
```env
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=4000
DEEPSEEK_TEMPERATURE=0.7
DEEPSEEK_TIMEOUT=60
DEBUG=false
```

#### Для Frontend клиента:
```env
REACT_APP_API_URL=https://your-server-domain.railway.app/api
REACT_APP_AI_API_URL=https://your-ai-domain.railway.app
```

## 🚀 Пошаговый деплой

### Шаг 1: Создание проекта на Railway

1. **Создайте новый проект** в Railway Dashboard
2. **Подключите GitHub репозиторий**
3. **Создайте 3 сервиса**:
   - `medical-server` (Backend)
   - `medical-ai` (AI Service)
   - `medical-client` (Frontend)

### Шаг 2: Настройка базы данных

1. **Добавьте PostgreSQL** в ваш проект
2. **Скопируйте DATABASE_URL** из настроек PostgreSQL
3. **Добавьте переменную** `DATABASE_URL` в настройки сервера

### Шаг 3: Деплой Backend сервера

1. **Выберите сервис** `medical-server`
2. **Настройте переменные окружения**:
   ```env
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-secret-key
   PORT=3001
   NODE_ENV=production
   CLIENT_URL=https://your-client-domain.railway.app
   ```
3. **Настройте деплой**:
   - **Source**: GitHub
   - **Branch**: main
   - **Root Directory**: server
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. **Запустите деплой**

### Шаг 4: Деплой AI сервиса

1. **Выберите сервис** `medical-ai`
2. **Настройте переменные окружения**:
   ```env
   DEEPSEEK_API_KEY=your-api-key
   DEEPSEEK_MODEL=deepseek-chat
   DEEPSEEK_MAX_TOKENS=4000
   DEEPSEEK_TEMPERATURE=0.7
   DEEPSEEK_TIMEOUT=60
   DEBUG=false
   ```
3. **Настройте деплой**:
   - **Source**: GitHub
   - **Branch**: main
   - **Root Directory**: ai-analyzer
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`
4. **Запустите деплой**

### Шаг 5: Деплой Frontend клиента

1. **Выберите сервис** `medical-client`
2. **Настройте переменные окружения**:
   ```env
   REACT_APP_API_URL=https://your-server-domain.railway.app/api
   REACT_APP_AI_API_URL=https://your-ai-domain.railway.app
   ```
3. **Настройте деплой**:
   - **Source**: GitHub
   - **Branch**: main
   - **Root Directory**: client
   - **Build Command**: `npm run build`
   - **Start Command**: `npx serve -s build -l 3000`
4. **Запустите деплой**

## 🔧 Настройка доменов

### 1. Получение доменов
После деплоя Railway автоматически создаст домены:
- `https://your-server-name.railway.app` (Backend)
- `https://your-ai-name.railway.app` (AI Service)
- `https://your-client-name.railway.app` (Frontend)

### 2. Обновление переменных окружения
Обновите переменные окружения с новыми доменами:

**В Backend сервисе:**
```env
CLIENT_URL=https://your-client-name.railway.app
```

**В Frontend сервисе:**
```env
REACT_APP_API_URL=https://your-server-name.railway.app/api
REACT_APP_AI_API_URL=https://your-ai-name.railway.app
```

## 🗄️ Настройка базы данных

### 1. Применение миграций
После деплоя сервера выполните миграции:

1. **Подключитесь к Railway CLI**:
   ```bash
   railway login
   railway link
   ```

2. **Примените миграции**:
   ```bash
   railway run --service medical-server npm run db:migrate:deploy
   ```

3. **Сгенерируйте Prisma клиент**:
   ```bash
   railway run --service medical-server npm run db:generate
   ```

## 🔍 Проверка работоспособности

### 1. Проверка Backend
```bash
curl https://your-server-name.railway.app/health
```

### 2. Проверка AI сервиса
```bash
curl https://your-ai-name.railway.app/health
```

### 3. Проверка Frontend
Откройте `https://your-client-name.railway.app` в браузере

## 🚨 Устранение проблем

### Проблема: Ошибка подключения к базе данных
**Решение:**
1. Проверьте `DATABASE_URL` в переменных окружения
2. Убедитесь, что PostgreSQL сервис запущен
3. Примените миграции: `railway run --service medical-server npm run db:migrate:deploy`

### Проблема: CORS ошибки
**Решение:**
1. Обновите `CLIENT_URL` в настройках сервера
2. Проверьте настройки CORS в `server/src/server.ts`

### Проблема: AI сервис не отвечает
**Решение:**
1. Проверьте `DEEPSEEK_API_KEY` в переменных окружения
2. Убедитесь, что AI сервис запущен
3. Проверьте логи: `railway logs --service medical-ai`

### Проблема: Frontend не загружается
**Решение:**
1. Проверьте `REACT_APP_API_URL` и `REACT_APP_AI_API_URL`
2. Убедитесь, что Backend и AI сервисы работают
3. Проверьте логи: `railway logs --service medical-client`

## 📊 Мониторинг

### 1. Просмотр логов
```bash
# Логи сервера
railway logs --service medical-server

# Логи AI сервиса
railway logs --service medical-ai

# Логи клиента
railway logs --service medical-client
```

### 2. Мониторинг ресурсов
- Откройте Railway Dashboard
- Перейдите в раздел "Metrics"
- Следите за использованием CPU, RAM и сети

## 🔐 Безопасность

### 1. Обязательные переменные
- `JWT_SECRET` - используйте длинный случайный ключ
- `DATABASE_URL` - не публикуйте в репозитории
- `DEEPSEEK_API_KEY` - храните в секрете

### 2. Рекомендации
- Регулярно обновляйте зависимости
- Используйте HTTPS (Railway предоставляет автоматически)
- Настройте мониторинг ошибок
- Регулярно делайте бэкапы базы данных

## 🎯 Готово!

После выполнения всех шагов ваш проект будет доступен по адресам:
- **Frontend**: `https://your-client-name.railway.app`
- **Backend API**: `https://your-server-name.railway.app`
- **AI Service**: `https://your-ai-name.railway.app`

Все сервисы будут автоматически перезапускаться при обновлении кода в GitHub репозитории. 
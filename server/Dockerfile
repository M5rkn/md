# Используем официальный Node.js образ
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем TypeScript
RUN npm run build

# Открываем порт
EXPOSE 3001

# Запускаем приложение
CMD ["npm", "start"] 
# Используем официальный образ Node.js
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем остальной код
COPY . .

# Создаем директории для данных
RUN mkdir -p /app/data /app/uploads /app/n8n

# Устанавливаем переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=3002
ENV DATABASE_URL="file:./data/dev.db"

# Генерируем Prisma клиент
RUN npx prisma generate

# Создаем базу данных и применяем миграции
RUN npx prisma db push

# Заполняем начальными данными
RUN npm run db:seed

# Создаем непривилегированного пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S documentuser -u 1001

# Меняем владельца файлов
RUN chown -R documentuser:nodejs /app
USER documentuser

# Открываем порт
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/api/health || exit 1

# Запускаем приложение
CMD ["npm", "start"]

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';

// Импорт роутов
import { authRouter } from '@/routes/auth';
import { formsRouter } from '@/routes/forms';
import { usersRouter } from '@/routes/users';
import { consultationsRouter } from '@/routes/consultations';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Trust proxy для корректной работы rate limiting
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'https://*.railway.app' // Разрешаем все Railway домены
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use(limiter);

// Более строгий лимит для аутентификации
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10, // максимум 10 попыток входа
  message: 'Слишком много попыток входа, попробуйте позже.'
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger настройка
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Medical Aggregator API',
      version: '1.0.0',
      description: 'API для медицинского агрегатора с ИИ-анализом',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Роуты
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Применяем лимит для аутентификации
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/forms', formsRouter);
app.use('/api/users', usersRouter);
app.use('/api/consultations', consultationsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Эндпоинт не найден'
  });
});

// Глобальная обработка ошибок
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Необработанная ошибка:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM получен, завершаем сервер...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT получен, завершаем сервер...');
  await prisma.$disconnect();
  process.exit(0);
});

// Запуск сервера
app.listen(PORT, () => {
  logger.info(`🚀 Сервер запущен на порту ${PORT}`);
  logger.info(`📚 API документация: http://localhost:${PORT}/api-docs`);
  logger.info(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app; 
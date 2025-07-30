import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Схемы валидации
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Введите корректный email адрес',
    'any.required': 'Email обязателен'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Пароль должен содержать минимум 6 символов',
    'any.required': 'Пароль обязателен'
  })
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Имя должно содержать минимум 2 символа',
    'string.max': 'Имя не должно превышать 50 символов',
    'any.required': 'Имя обязательно'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Введите корректный email адрес',
    'any.required': 'Email обязателен'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Пароль должен содержать минимум 6 символов',
    'any.required': 'Пароль обязателен'
  }),
  phone: Joi.string().pattern(/^\+7[9]\d{9}$/).optional().messages({
    'string.pattern.base': 'Номер телефона должен быть российским в формате +79991234567'
  })
});

// Генерация JWT токена
const generateToken = (userId: string) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'default-secret',
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register - Регистрация
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Проверяем уникальность email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({
          success: false,
          message: 'Пользователь с таким email уже существует'
        });
      }
      if (phone && existingUser.phone === phone) {
        return res.status(409).json({
          success: false,
          message: 'Этот номер телефона уже используется другим пользователем'
        });
      }
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        phoneVerified: false,
        role: 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Генерируем токен
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Регистрация прошла успешно',
      user,
      token
    });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// POST /api/auth/login - Вход
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Неверный пароль'
      });
    }

    // Генерируем токен
    const token = generateToken(user.id);

    // Получаем данные пользователя без пароля
    const userWithoutPassword = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      message: 'Вход выполнен успешно',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// GET /api/auth/me - Получить текущего пользователя
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// POST /api/auth/logout - Выход (опциональный)
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // В реальном приложении здесь можно добавить токен в черный список
    res.json({
      success: true,
      message: 'Выход выполнен успешно'
    });
  } catch (error) {
    console.error('Ошибка выхода:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

export { router as authRouter }; 
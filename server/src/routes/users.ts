import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { smsService } from '@/services/SmsService';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Схемы валидации
const phoneSchema = Joi.object({
  phone: Joi.string().pattern(/^\+[1-9]\d{1,14}$/).required()
    .messages({
      'string.pattern.base': 'Номер телефона должен быть в международном формате (+79991234567)'
    })
});

const verifyCodeSchema = Joi.object({
  code: Joi.string().length(6).pattern(/^\d{6}$/).required()
    .messages({
      'string.length': 'SMS код должен содержать 6 цифр',
      'string.pattern.base': 'SMS код должен содержать только цифры'
    })
});

// GET /api/users/stats - Получение статистики пользователя
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    // Получаем статистику по анкетам
    const formsCount = await prisma.form.count({
      where: { userId }
    });

    // Получаем статистику по рекомендациям (анализам)
    const analysesCount = await prisma.form.count({
      where: { 
        userId,
        recommendations: {
          some: {}
        }
      }
    });

    // Вычисляем среднюю уверенность (пока возвращаем 0, так как нет поля в БД)
    const averageConfidence = analysesCount > 0 ? 85 : 0; // Заглушка

    res.json({
      success: true,
      stats: {
        formsCount,
        analysesCount, 
        averageConfidence
      }
    });

  } catch (error) {
    console.error('💥 Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// GET /api/users/analyses - Получение анализов пользователя
router.get('/analyses', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const analyses = await prisma.form.findMany({
      where: { 
        userId,
        recommendations: {
          some: {}
        }
      },
      include: {
        recommendations: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      analyses: analyses.map(form => ({
        id: form.id,
        date: form.createdAt,
        status: 'completed',
        confidence: Math.round(form.recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / form.recommendations.length * 100) || 0,
        recommendations: form.recommendations.map(rec => ({
          name: rec.name,
          dosage: rec.dose,
          priority: rec.confidence > 0.8 ? 'high' : rec.confidence > 0.5 ? 'medium' : 'low'
        }))
      }))
    });

  } catch (error) {
    console.error('💥 Ошибка получения анализов:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// GET /api/users/all-forms - Получение всех форм пользователя включая pending
router.get('/all-forms', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    // Получаем все формы пользователя
    const allForms = await prisma.form.findMany({
      where: { userId },
      include: {
        recommendations: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      forms: allForms.map(form => ({
        id: form.id,
        date: form.createdAt,
        status: form.recommendations.length > 0 ? 'completed' : 'pending',
        confidence: form.recommendations.length > 0 
          ? Math.round(form.recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / form.recommendations.length * 100) 
          : 0,
        recommendationsCount: form.recommendations.length,
        recommendations: form.recommendations.map(rec => ({
          name: rec.name,
          dosage: rec.dose,
          priority: rec.confidence > 0.8 ? 'high' : rec.confidence > 0.5 ? 'medium' : 'low'
        }))
      }))
    });

  } catch (error) {
    console.error('💥 Ошибка получения всех форм:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// GET /api/users/profile - Получение профиля пользователя
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        phoneVerifiedAt: true,
        createdAt: true
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
    console.error('💥 Ошибка получения профиля:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// POST /api/users/phone - Добавление/обновление номера телефона
router.post('/phone', authMiddleware, validateRequest(phoneSchema), async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { phone } = req.body;

    console.log('📱 Добавление телефона для пользователя:', userId, phone);

    // Проверяем уникальность номера телефона
    if (phone) {
      const existingUserWithPhone = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: userId } // Исключаем текущего пользователя
        }
      });

      if (existingUserWithPhone) {
        return res.status(409).json({
          success: false,
          message: 'Этот номер телефона уже используется другим пользователем'
        });
      }
    }

    // Обновляем номер телефона и сбрасываем верификацию
    await prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        phoneVerified: false,
        phoneVerifiedAt: null
      }
    });

    res.json({
      success: true,
      message: 'Номер телефона добавлен. Отправьте SMS код для подтверждения.'
    });

  } catch (error) {
    console.error('💥 Ошибка добавления телефона:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// POST /api/users/phone/verify - Отправка SMS кода
router.post('/phone/verify', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, phoneVerified: true }
    });

    if (!user || !user.phone) {
      return res.status(400).json({
        success: false,
        message: 'Сначала добавьте номер телефона'
      });
    }

    if (user.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Номер телефона уже подтвержден'
      });
    }

    // Удаляем старые неподтвержденные коды для этого пользователя
    await prisma.phoneVerification.deleteMany({
      where: {
        userId,
        verified: false
      }
    });

    // Генерируем новый код
    const code = smsService.generateCode();
    const codeHash = smsService.hashCode(code);
    
    // Создаем запись верификации (действует 10 минут)
    const expiresAt = new Date(Date.now() + (parseInt(process.env.SMS_CODE_EXPIRY_MINUTES || '10') * 60 * 1000));
    
    console.log('📱 Отправляем SMS код для пользователя:', userId);
    
    // Отправляем SMS через SMS.ru
    const smsResult = await smsService.sendSms(user.phone, code);
    
    if (!smsResult.success) {
      console.error('❌ Ошибка отправки SMS:', smsResult.message);
      return res.status(500).json({
        success: false,
        message: smsResult.message
      });
    }

    // Сохраняем хэш кода в базе данных
    await prisma.phoneVerification.create({
      data: {
        userId,
        phone: user.phone,
        codeHash,
        smsId: smsResult.smsId,
        expiresAt
      }
    });

    console.log('✅ SMS успешно отправлен, ID:', smsResult.smsId);

    res.json({
      success: true,
      message: 'SMS код отправлен на ваш номер телефона',
      // В development режиме показываем код для тестирования
      developmentCode: process.env.NODE_ENV === 'development' && !smsService.getSettings().enabled ? code : undefined
    });

  } catch (error) {
    console.error('💥 Ошибка отправки SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// POST /api/users/phone/confirm - Подтверждение SMS кода
router.post('/phone/confirm', authMiddleware, validateRequest(verifyCodeSchema), async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { code } = req.body;

    console.log('📱 Подтверждение SMS кода для пользователя:', userId);

    // Находим все активные верификации пользователя
    const verifications = await prisma.phoneVerification.findMany({
      where: {
        userId,
        verified: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (verifications.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Код верификации не найден или истек. Запросите новый код.'
      });
    }

    // Ищем верификацию с подходящим хэшем кода
    let matchedVerification = null;
    
    for (const verification of verifications) {
      if (smsService.verifyCode(code, verification.codeHash)) {
        matchedVerification = verification;
        break;
      }
    }

    if (!matchedVerification) {
      // Проверяем, не истекли ли все коды
      const hasExpiredCodes = await prisma.phoneVerification.count({
        where: {
          userId,
          verified: false,
          expiresAt: { lt: new Date() }
        }
      });

      if (hasExpiredCodes > 0) {
        return res.status(400).json({
          success: false,
          message: 'SMS код истек. Запросите новый код.'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Неверный SMS код. Проверьте правильность ввода.'
      });
    }

    console.log('✅ SMS код подтвержден, ID верификации:', matchedVerification.id);

    // Помечаем код как использованный
    await prisma.phoneVerification.update({
      where: { id: matchedVerification.id },
      data: { verified: true }
    });

    // Получаем номер телефона из верификации
    const phone = matchedVerification.phone;

    // Проверяем что телефон принадлежит этому пользователю
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, phoneVerified: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    if (user.phone !== phone) {
      return res.status(400).json({
        success: false,
        message: 'Этот номер телефона не привязан к вашему аккаунту'
      });
    }

    if (user.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Номер телефона уже подтвержден'
      });
    }

    // Дополнительная проверка: убеждаемся что номер не используется другим пользователем
    const phoneOwner = await prisma.user.findFirst({
      where: {
        phone: phone,
        phoneVerified: true,
        id: { not: userId }
      }
    });

    if (phoneOwner) {
      return res.status(409).json({
        success: false,
        message: 'Этот номер телефона уже подтвержден другим пользователем'
      });
    }

    // Помечаем телефон как подтвержденный
    await prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerified: true,
        phoneVerifiedAt: new Date()
      }
    });

    // Удаляем остальные неиспользованные коды этого пользователя
    await prisma.phoneVerification.deleteMany({
      where: {
        userId,
        verified: false,
        id: { not: matchedVerification.id }
      }
    });

    console.log('🎉 Телефон успешно подтвержден для пользователя:', userId);

    res.json({
      success: true,
      message: 'Номер телефона успешно подтвержден!'
    });

  } catch (error) {
    console.error('💥 Ошибка подтверждения SMS:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

export { router as usersRouter }; 
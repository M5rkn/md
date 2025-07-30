import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { consultationService } from '@/services/ConsultationService';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /api/consultations/schedule - Получение расписания консультаций
router.get('/schedule', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const days = parseInt(req.query.days as string) || 14;

    console.log('📅 Получение расписания на', days, 'дней для пользователя:', userId);

    // Получаем информацию о пользователе
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasConsultation: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Генерируем расписание на указанное количество дней
    const schedule = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      const dayName = date.toLocaleDateString('ru-RU', { weekday: 'long' });
      const dateStr = date.toISOString().split('T')[0];
      
      // Генерируем временные слоты с 9:00 до 18:00
      const slots = [];
      for (let hour = 9; hour <= 18; hour++) {
        const time = `${hour.toString().padStart(2, '0')}:00`;
        
        // Проверяем, есть ли уже запись на это время
        const existingConsultation = await prisma.consultation.findFirst({
          where: {
            date: date,
            time: time,
            status: {
              in: ['SCHEDULED', 'CONFIRMED']
            }
          }
        });

        const isAvailable = !existingConsultation;
        const isFirstConsultation = !user.hasConsultation;
        
        slots.push({
          id: `${dateStr}-${time}`,
          time,
          available: isAvailable,
          price: isFirstConsultation ? 1 : 1500,
          isFirstConsultation
        });
      }
      
      schedule.push({
        date: dateStr,
        dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
        slots
      });
    }

    res.json({
      success: true,
      schedule,
      userHasConsultation: user.hasConsultation
    });

  } catch (error) {
    console.error('💥 Ошибка получения расписания:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// POST /api/consultations/book - Запись на консультацию
router.post('/book', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { date, time, formId } = req.body;

    console.log('📅 Запись на консультацию:', { userId, date, time, formId });

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо указать дату и время консультации'
      });
    }

    // Получаем информацию о пользователе
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hasConsultation: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Пользователь не найден'
      });
    }

    // Проверяем доступность времени
    const existingConsultation = await prisma.consultation.findFirst({
      where: {
        date: new Date(date),
        time: time,
        status: {
          in: ['SCHEDULED', 'CONFIRMED']
        }
      }
    });

    if (existingConsultation) {
      return res.status(400).json({
        success: false,
        message: 'Выбранное время уже занято'
      });
    }

    // Определяем цену и тип консультации
    const isFirstConsultation = !user.hasConsultation;
    const price = isFirstConsultation ? 1 : 1500;

    // Создаем запись на консультацию
    const consultation = await prisma.consultation.create({
      data: {
        userId,
        formId: formId || null,
        date: new Date(date),
        time,
        price,
        isFirst: isFirstConsultation,
        status: 'SCHEDULED'
      }
    });

    // Если это первая консультация, обновляем флаг у пользователя
    if (isFirstConsultation) {
      await prisma.user.update({
        where: { id: userId },
        data: { hasConsultation: true }
      });
    }

    res.json({
      success: true,
      message: 'Запись на консультацию успешно создана!',
      consultation: {
        id: consultation.id,
        date: consultation.date,
        time: consultation.time,
        price: consultation.price,
        isFirst: consultation.isFirst
      }
    });

  } catch (error) {
    console.error('💥 Ошибка записи на консультацию:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// GET /api/consultations/my - Мои консультации
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    console.log('📅 Получение консультаций пользователя:', userId);

    const consultations = await prisma.consultation.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      include: {
        form: {
          select: {
            id: true,
            createdAt: true
          }
        }
      }
    });

    res.json({
      success: true,
      consultations: consultations.map(consultation => ({
        id: consultation.id,
        date: consultation.date,
        time: consultation.time,
        status: consultation.status,
        price: consultation.price,
        isFirst: consultation.isFirst,
        notes: consultation.notes,
        meetingLink: consultation.meetingLink,
        createdAt: consultation.createdAt,
        hasForm: !!consultation.form
      }))
    });

  } catch (error) {
    console.error('💥 Ошибка получения консультаций:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// DELETE /api/consultations/:id/cancel - Отмена консультации
router.delete('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const consultationId = req.params.id;

    console.log('❌ Отмена консультации:', { userId, consultationId });

    const consultation = await prisma.consultation.findFirst({
      where: {
        id: consultationId,
        userId
      }
    });

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Консультация не найдена'
      });
    }

    if (consultation.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Нельзя отменить завершенную консультацию'
      });
    }

    await prisma.consultation.update({
      where: { id: consultationId },
      data: { status: 'CANCELLED' }
    });

    res.json({
      success: true,
      message: 'Консультация успешно отменена'
    });

  } catch (error) {
    console.error('💥 Ошибка отмены консультации:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// GET /api/consultations/check - Проверка возможности бесплатной консультации
router.get('/check', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    console.log('📞 Проверка возможности консультации для пользователя:', userId);

    const eligibility = await consultationService.checkFreeConsultationEligibility(userId);

    res.json({
      success: true,
      eligible: eligibility.eligible,
      message: eligibility.message,
      lastConsultation: eligibility.lastConsultation
    });

  } catch (error) {
    console.error('💥 Ошибка проверки консультации:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// POST /api/consultations/request - Запрос бесплатной консультации
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    console.log('📞 Запрос бесплатной консультации от пользователя:', userId);

    // Проверяем возможность консультации
    const eligibility = await consultationService.checkFreeConsultationEligibility(userId);

    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.message,
        lastConsultation: eligibility.lastConsultation
      });
    }

    // Записываем консультацию
    const result = await consultationService.logFreeConsultation(userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: 'Бесплатная консультация успешно записана!',
      consultationId: result.consultationId
    });

  } catch (error) {
    console.error('💥 Ошибка записи консультации:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// GET /api/consultations/history - История консультаций пользователя
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    console.log('📞 Получение истории консультаций для пользователя:', userId);

    const history = await consultationService.getUserConsultationHistory(userId);

    if (!history.success) {
      return res.status(500).json({
        success: false,
        message: history.message
      });
    }

    res.json({
      success: true,
      consultations: history.consultations
    });

  } catch (error) {
    console.error('💥 Ошибка получения истории консультаций:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// GET /api/consultations/count - Количество консультаций за период
router.get('/count', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const days = parseInt(req.query.days as string) || 30;

    console.log('📞 Подсчет консультаций за', days, 'дней для пользователя:', userId);

    const count = await consultationService.getConsultationCount(userId, days);

    res.json({
      success: true,
      count: count.count,
      period: count.period
    });

  } catch (error) {
    console.error('💥 Ошибка подсчета консультаций:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

export { router as consultationsRouter }; 
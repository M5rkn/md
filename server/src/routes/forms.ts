import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import Joi from 'joi';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();

// Схема валидации для анкеты (обновленная)
const formSchema = Joi.object({
  // ПУНКТ ПЕРВЫЙ - Персональная информация
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  middleName: Joi.string().allow(''),
  phone: Joi.string().allow(''),
  email: Joi.string().email().required(),
  birthDate: Joi.string().allow(''),
  age: Joi.string().allow(''),
  gender: Joi.string().allow(''),
  maritalStatus: Joi.string().allow(''),
  hasChildren: Joi.string().allow(''),
  childrenAge: Joi.string().allow(''),
  height: Joi.string().allow(''),
  weight: Joi.string().allow(''),
  weightYearAgo: Joi.string().allow(''),

  // ПУНКТ ВТОРОЙ - Образ жизни
  country: Joi.string().allow(''),
  city: Joi.string().allow(''),
  activityLevel: Joi.string().allow(''),
  workType: Joi.string().allow(''),
  isStudent: Joi.boolean().default(false),
  wakeUpTime: Joi.string().allow(''),
  sleepTime: Joi.string().allow(''),
  sleepQuality: Joi.string().allow(''),
  breakfast: Joi.string().allow(''),
  mealsPerDay: Joi.string().allow(''),
  mainMeal: Joi.string().allow(''),
  mealIntervals: Joi.string().allow(''),
  dinnerToSleep: Joi.string().allow(''),
  emotionalState: Joi.array().items(Joi.string().allow('')).default([]),
  stressLevel: Joi.string().allow(''),
  alcoholSmoking: Joi.string().allow(''),

  // ПУНКТ ТРЕТИЙ - Медицинская информация
  familyMedicalHistory: Joi.string().allow(''),
  personalMedicalHistory: Joi.string().allow(''),
  chronicDiseases: Joi.string().allow(''),
  surgeries: Joi.string().allow(''),
  lactoseReaction: Joi.string().allow(''),
  caseinReaction: Joi.string().allow(''),
  glutenReaction: Joi.string().allow(''),
  drugReaction: Joi.string().allow(''),
  vaccineReaction: Joi.string().allow(''),
  foodAllergy: Joi.string().allow(''),
  seasonalAllergy: Joi.string().allow(''),

  // Системы организма (checkbox arrays)
  nervousSystem: Joi.array().items(Joi.string().allow('')).default([]),
  vision: Joi.array().items(Joi.string().allow('')).default([]),
  entSystem: Joi.array().items(Joi.string().allow('')).default([]),
  cardiovascular: Joi.array().items(Joi.string().allow('')).default([]),
  gastrointestinal: Joi.array().items(Joi.string().allow('')).default([]),
  genitourinary: Joi.array().items(Joi.string().allow('')).default([]),
  skin: Joi.array().items(Joi.string().allow('')).default([]),
  hair: Joi.array().items(Joi.string().allow('')).default([]),
  nails: Joi.array().items(Joi.string().allow('')).default([]),
  endocrine: Joi.array().items(Joi.string().allow('')).default([]),
  musculoskeletal: Joi.array().items(Joi.string().allow('')).default([]),

  // Женские вопросы
  regularCycle: Joi.string().allow(''),
  pmsSymptoms: Joi.string().allow(''),
  oralContraceptives: Joi.string().allow(''),
  pregnancies: Joi.string().allow(''),
  births: Joi.string().allow(''),
  miscarriages: Joi.string().allow(''),
  gynecologicalDiseases: Joi.array().items(Joi.string().allow('')).default([]),
  menopauseSymptoms: Joi.array().items(Joi.string().allow('')).default([]),

  // Лекарства и добавки
  medications: Joi.string().allow('')
});

// POST /api/forms/submit - Отправка анкеты на анализ
router.post('/submit', authMiddleware, validateRequest(formSchema), async (req, res) => {
  try {
    const userId = (req as any).userId;
    const formData = req.body;

    console.log('📝 Получена анкета от пользователя:', userId);

    // 1. Сохраняем анкету в базе данных
    const form = await prisma.form.create({
      data: {
        userId: userId,
        answers: formData
      }
    });

    console.log('✅ Анкета сохранена в БД:', form.id);

    // 2. Отправляем данные в AI Analyzer для анализа
    try {
      const aiAnalyzerUrl = process.env.AI_ANALYZER_URL || 'http://localhost:8000';
      
      console.log('🧠 Отправляем данные в AI Analyzer...');
      
      const aiResponse = await axios.post(`${aiAnalyzerUrl}/api/v1/analyze`, {
        form_data: formData,
        user_id: userId
      }, {
        timeout: 30000, // 30 секунд таймаут
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('🎯 AI анализ завершен:', aiResponse.data);

      // 3. Сохраняем рекомендации в базе данных
      if (aiResponse.data.success && aiResponse.data.recommendations) {
        const recommendations = [];
        
        for (const recommendation of aiResponse.data.recommendations) {
          recommendations.push({
            formId: form.id,
            name: recommendation.name,
            dose: recommendation.dosage,
            duration: '2 месяца',
            description: recommendation.reason,
            confidence: recommendation.confidence
          });
        }

        await prisma.recommendation.createMany({
          data: recommendations
        });

        console.log('💊 Рекомендации сохранены:', recommendations.length);
      }

      // 4. Возвращаем результат клиенту
      res.json({
        success: true,
        message: 'Анкета успешно обработана и проанализирована',
        form: {
          id: form.id,
          createdAt: form.createdAt
        },
        analysis: {
          id: `analysis_${form.id}`,
          confidence: aiResponse.data.analysis?.health_score || 75,
          recommendationsCount: aiResponse.data.recommendations?.length || 0,
          recommendationsText: 'Анализ выполнен успешно'
        }
      });

    } catch (aiError) {
      console.error('❌ Ошибка AI анализа:', aiError);
      
      // Если AI анализ неудачен, сохраняем как pending
      res.status(202).json({
        success: true,
        message: 'Анкета сохранена. Анализ будет выполнен позже.',
        form: {
          id: form.id,
          createdAt: form.createdAt
        },
        analysis: {
          status: 'pending',
          message: 'Анализ будет выполнен в ближайшее время'
        }
      });
    }

  } catch (error) {
    console.error('💥 Ошибка обработки анкеты:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при обработке анкеты'
    });
  }
});

// GET /api/forms/results/:formId - Получение результатов анализа
router.get('/results/:formId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { formId } = req.params;

    // Проверяем что анкета принадлежит пользователю
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        userId: userId
      },
      include: {
        recommendations: true
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Анкета не найдена'
      });
    }

    res.json({
      success: true,
      form: {
        id: form.id,
        createdAt: form.createdAt,
        answers: form.answers
      },
      recommendations: form.recommendations.map(rec => ({
        id: rec.id,
        name: rec.name,
        dosage: rec.dose,
        priority: rec.confidence > 0.8 ? 'high' : rec.confidence > 0.5 ? 'medium' : 'low',
        reason: rec.description || '',
        duration: rec.duration,
        confidence: rec.confidence
      })),
      analysis: {
        healthScore: Math.round(form.recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / Math.max(form.recommendations.length, 1) * 100),
        summary: `На основе анализа вашей анкеты сформировано ${form.recommendations.length} рекомендаций.`
      }
    });

  } catch (error) {
    console.error('💥 Ошибка получения результатов:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// GET /api/forms/my - Получение всех анкет пользователя
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const forms = await prisma.form.findMany({
      where: {
        userId: userId
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
      forms: forms.map(form => ({
        id: form.id,
        createdAt: form.createdAt,
        recommendationsCount: form.recommendations.length,
        hasRecommendations: form.recommendations.length > 0
      }))
    });

  } catch (error) {
    console.error('💥 Ошибка получения анкет:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
});

// POST /api/forms/retry-analysis/:formId - Повторная отправка анализа
router.post('/retry-analysis/:formId', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { formId } = req.params;

    console.log('🔄 Повторная отправка анализа для формы:', formId);

    // Проверяем что форма принадлежит пользователю
    const form = await prisma.form.findFirst({
      where: {
        id: formId,
        userId: userId
      },
      include: {
        recommendations: true
      }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Форма не найдена'
      });
    }

    // Проверяем что у формы нет рекомендаций (pending статус)
    if (form.recommendations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Анализ уже выполнен для этой формы'
      });
    }

    // Отправляем данные в AI Analyzer для анализа
    try {
      const aiAnalyzerUrl = process.env.AI_ANALYZER_URL || 'http://localhost:8000';
      
      console.log('🧠 Повторно отправляем данные в AI Analyzer...');
      
      const aiResponse = await axios.post(`${aiAnalyzerUrl}/api/v1/analyze`, {
        form_data: form.answers,
        user_id: userId
      }, {
        timeout: 30000, // 30 секунд для AI анализа
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('🎯 Повторный AI анализ завершен:', aiResponse.data);

      // Сохраняем рекомендации в базе данных
      if (aiResponse.data.success && aiResponse.data.recommendations) {
        const recommendations = [];
        
        for (const recommendation of aiResponse.data.recommendations) {
          recommendations.push({
            formId: form.id,
            name: recommendation.name,
            dose: recommendation.dosage,
            duration: '2 месяца',
            description: recommendation.reason,
            confidence: recommendation.confidence
          });
        }

        await prisma.recommendation.createMany({
          data: recommendations
        });

        console.log('💊 Рекомендации сохранены при повторной обработке:', recommendations.length);

        // Возвращаем успешный результат
        res.json({
          success: true,
          message: 'Анализ успешно выполнен',
          form: {
            id: form.id,
            createdAt: form.createdAt
          },
          analysis: {
            id: `analysis_${form.id}`,
            confidence: aiResponse.data.analysis?.health_score || 75,
            recommendationsCount: aiResponse.data.recommendations?.length || 0,
            recommendationsText: 'Анализ выполнен успешно'
          }
        });
      } else {
        throw new Error('Получен некорректный ответ от AI сервиса');
      }

    } catch (aiError) {
      console.error('❌ Ошибка повторного AI анализа:', aiError);
      
      res.status(500).json({
        success: false,
        message: 'AI сервис временно недоступен. Попробуйте позже.',
        error: aiError instanceof Error ? aiError.message : 'Неизвестная ошибка'
      });
    }

  } catch (error: any) {
    console.error('💥 Ошибка повторной отправки анализа:', error);
    res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message
    });
  }
});

export { router as formsRouter }; 
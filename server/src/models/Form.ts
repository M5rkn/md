import { PrismaClient, Form } from '@prisma/client';

const prisma = new PrismaClient();

// Интерфейс для данных медицинской анкеты
export interface CreateFormData {
  userId: string;
  answers: FormAnswers;
}

export interface UpdateFormData {
  answers: FormAnswers;
}

// Структура ответов медицинской анкеты
export interface FormAnswers {
  // Персональная информация
  personalInfo: {
    age: number;
    gender: 'male' | 'female' | 'other';
    weight: number; // кг
    height: number; // см
    activityLevel: 'low' | 'moderate' | 'high';
  };
  
  // Медицинская информация
  medicalInfo: {
    chronicDiseases: string[];
    currentMedications: string[];
    allergies: string[];
    pregnancyLactation?: boolean;
  };
  
  // Симптомы и жалобы
  symptoms: {
    energyLevel: 1 | 2 | 3 | 4 | 5;
    sleepQuality: 1 | 2 | 3 | 4 | 5;
    stressLevel: 1 | 2 | 3 | 4 | 5;
    digestiveIssues: string[];
    otherSymptoms: string[];
  };
  
  // Образ жизни
  lifestyle: {
    diet: 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'other';
    smokingAlcohol: {
      smoking: boolean;
      alcohol: 'none' | 'occasional' | 'moderate' | 'frequent';
    };
    supplementHistory: string[];
  };
  
  // Цели и предпочтения
  goals: {
    healthGoals: string[];
    budgetRange: 'low' | 'medium' | 'high' | 'premium';
    deliveryPreference: string;
  };
}

export interface FormWithFiles extends Form {
  files: {
    id: string;
    filename: string;
    path: string;
    mimetype: string;
    size: number;
    uploadedAt: Date;
  }[];
}

/**
 * Модель медицинской анкеты
 */
export class FormModel {
  /**
   * Создание новой анкеты
   */
  static async create(formData: CreateFormData): Promise<Form> {
    const form = await prisma.form.create({
      data: {
        userId: formData.userId,
        answers: formData.answers as any,
      },
    });

    return form;
  }

  /**
   * Поиск анкеты по ID
   */
  static async findById(id: string): Promise<FormWithFiles | null> {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        files: {
          select: {
            id: true,
            filename: true,
            path: true,
            mimetype: true,
            size: true,
            uploadedAt: true,
          },
        },
      },
    });

    return form;
  }

  /**
   * Получение всех анкет пользователя
   */
  static async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ forms: Form[]; total: number }> {
    const skip = (page - 1) * limit;

    const [forms, total] = await Promise.all([
      prisma.form.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.form.count({
        where: { userId },
      }),
    ]);

    return { forms, total };
  }

  /**
   * Обновление анкеты
   */
  static async update(id: string, formData: UpdateFormData): Promise<Form> {
    const form = await prisma.form.update({
      where: { id },
      data: {
        answers: formData.answers as any,
      },
    });

    return form;
  }

  /**
   * Удаление анкеты
   */
  static async delete(id: string): Promise<void> {
    await prisma.form.delete({
      where: { id },
    });
  }

  /**
   * Получение последней анкеты пользователя
   */
  static async findLatestByUserId(userId: string): Promise<Form | null> {
    const form = await prisma.form.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return form;
  }

  /**
   * Получение анкет с рекомендациями
   */
  static async findWithRecommendations(id: string) {
    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        recommendations: {
          orderBy: { confidence: 'desc' },
        },
        files: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return form;
  }

  /**
   * Поиск анкет по критериям для аналитики
   */
  static async findForAnalytics(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    ageRange?: { min: number; max: number };
    gender?: string;
  }) {
    // Простой поиск анкет для аналитики
    // В реальном проекте здесь были бы более сложные запросы с JSON фильтрацией
    const forms = await prisma.form.findMany({
      where: {
        ...(filters.dateFrom && { createdAt: { gte: filters.dateFrom } }),
        ...(filters.dateTo && { createdAt: { lte: filters.dateTo } }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recommendations: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return forms;
  }

  /**
   * Валидация структуры ответов анкеты
   */
  static validateAnswers(answers: any): answers is FormAnswers {
    return (
      answers &&
      answers.personalInfo &&
      answers.medicalInfo &&
      answers.symptoms &&
      answers.lifestyle &&
      answers.goals &&
      typeof answers.personalInfo.age === 'number' &&
      Array.isArray(answers.medicalInfo.chronicDiseases) &&
      Array.isArray(answers.goals.healthGoals)
    );
  }
}

export default FormModel; 
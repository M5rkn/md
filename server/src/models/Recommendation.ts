import { PrismaClient, Recommendation } from '@prisma/client';

const prisma = new PrismaClient();

// Интерфейсы для рекомендаций
export interface CreateRecommendationData {
  formId: string;
  name: string;
  dose: string;
  duration: string;
  description?: string;
  confidence: number;
}

export interface UpdateRecommendationData {
  name?: string;
  dose?: string;
  duration?: string;
  description?: string;
  confidence?: number;
}

export interface RecommendationWithForm extends Recommendation {
  form: {
    id: string;
    userId: string;
    answers: any;
    createdAt: Date;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
}

/**
 * Модель ИИ-рекомендаций по БАДам
 */
export class RecommendationModel {
  /**
   * Создание новой рекомендации
   */
  static async create(recommendationData: CreateRecommendationData): Promise<Recommendation> {
    const recommendation = await prisma.recommendation.create({
      data: {
        formId: recommendationData.formId,
        name: recommendationData.name,
        dose: recommendationData.dose,
        duration: recommendationData.duration,
        description: recommendationData.description,
        confidence: recommendationData.confidence,
      },
    });

    return recommendation;
  }

  /**
   * Создание множественных рекомендаций для одной анкеты
   */
  static async createMany(recommendations: CreateRecommendationData[]): Promise<number> {
    const result = await prisma.recommendation.createMany({
      data: recommendations,
    });

    return result.count;
  }

  /**
   * Поиск рекомендации по ID
   */
  static async findById(id: string): Promise<Recommendation | null> {
    const recommendation = await prisma.recommendation.findUnique({
      where: { id },
    });

    return recommendation;
  }

  /**
   * Получение всех рекомендаций для анкеты
   */
  static async findByFormId(formId: string): Promise<Recommendation[]> {
    const recommendations = await prisma.recommendation.findMany({
      where: { formId },
      orderBy: { confidence: 'desc' },
    });

    return recommendations;
  }

  /**
   * Получение топ рекомендаций с высокой уверенностью
   */
  static async findTopRecommendations(
    formId: string,
    limit: number = 5,
    minConfidence: number = 0.7
  ): Promise<Recommendation[]> {
    const recommendations = await prisma.recommendation.findMany({
      where: {
        formId,
        confidence: { gte: minConfidence },
      },
      take: limit,
      orderBy: { confidence: 'desc' },
    });

    return recommendations;
  }

  /**
   * Обновление рекомендации
   */
  static async update(id: string, recommendationData: UpdateRecommendationData): Promise<Recommendation> {
    const recommendation = await prisma.recommendation.update({
      where: { id },
      data: recommendationData,
    });

    return recommendation;
  }

  /**
   * Удаление рекомендации
   */
  static async delete(id: string): Promise<void> {
    await prisma.recommendation.delete({
      where: { id },
    });
  }

  /**
   * Получение рекомендаций с информацией о пользователе
   */
  static async findWithUserInfo(formId: string): Promise<RecommendationWithForm[]> {
    const recommendations = await prisma.recommendation.findMany({
      where: { formId },
      include: {
        form: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { confidence: 'desc' },
    });

    return recommendations;
  }

  /**
   * Поиск рекомендаций по названию БАДа
   */
  static async findBySupplementName(supplementName: string): Promise<Recommendation[]> {
    const recommendations = await prisma.recommendation.findMany({
      where: {
        name: {
          contains: supplementName,
          mode: 'insensitive',
        },
      },
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return recommendations;
  }

  /**
   * Получение статистики рекомендаций
   */
  static async getStats(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    minConfidence?: number;
  } = {}) {
    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    if (filters.minConfidence) {
      where.confidence = { gte: filters.minConfidence };
    }

    const [
      totalRecommendations,
      averageConfidence,
      topSupplements,
      confidenceDistribution,
    ] = await Promise.all([
      prisma.recommendation.count({ where }),
      prisma.recommendation.aggregate({
        where,
        _avg: { confidence: true },
      }),
      prisma.recommendation.groupBy({
        by: ['name'],
        where,
        _count: { name: true },
        orderBy: { _count: { name: 'desc' } },
        take: 10,
      }),
      prisma.recommendation.groupBy({
        by: ['confidence'],
        where,
        _count: { confidence: true },
      }),
    ]);

    return {
      totalRecommendations,
      averageConfidence: Number(averageConfidence._avg.confidence || 0),
      topSupplements: topSupplements.map(item => ({
        name: item.name,
        count: item._count.name,
      })),
      confidenceDistribution,
    };
  }

  /**
   * Получение последних рекомендаций
   */
  static async findRecent(limit: number = 10): Promise<RecommendationWithForm[]> {
    const recommendations = await prisma.recommendation.findMany({
      take: limit,
      include: {
        form: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return recommendations;
  }

  /**
   * Удаление всех рекомендаций для анкеты
   */
  static async deleteByFormId(formId: string): Promise<number> {
    const result = await prisma.recommendation.deleteMany({
      where: { formId },
    });

    return result.count;
  }

  /**
   * Валидация данных рекомендации
   */
  static validateRecommendationData(data: any): data is CreateRecommendationData {
    return (
      data &&
      typeof data.formId === 'string' &&
      typeof data.name === 'string' &&
      typeof data.dose === 'string' &&
      typeof data.duration === 'string' &&
      typeof data.confidence === 'number' &&
      data.confidence >= 0 &&
      data.confidence <= 1
    );
  }

  /**
   * Поиск дублирующихся рекомендаций
   */
  static async findDuplicates(formId: string, supplementName: string): Promise<Recommendation[]> {
    const recommendations = await prisma.recommendation.findMany({
      where: {
        formId,
        name: {
          equals: supplementName,
          mode: 'insensitive',
        },
      },
    });

    return recommendations;
  }
}

export default RecommendationModel; 
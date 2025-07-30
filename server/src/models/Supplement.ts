import { PrismaClient, Supplement } from '@prisma/client';

const prisma = new PrismaClient();

// Интерфейсы для работы с БАДами
export interface CreateSupplementData {
  name: string;
  price: number;
  description: string;
  tags: string[];
  inStock?: boolean;
}

export interface UpdateSupplementData {
  name?: string;
  price?: number;
  description?: string;
  tags?: string[];
  inStock?: boolean;
}

export interface SupplementFilters {
  search?: string;
  tags?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  inStock?: boolean;
}

/**
 * Модель каталога БАДов и пищевых добавок
 */
export class SupplementModel {
  /**
   * Создание нового БАДа в каталоге
   */
  static async create(supplementData: CreateSupplementData): Promise<Supplement> {
    const supplement = await prisma.supplement.create({
      data: {
        name: supplementData.name,
        price: supplementData.price,
        description: supplementData.description,
        tags: supplementData.tags,
        inStock: supplementData.inStock ?? true,
      },
    });

    return supplement;
  }

  /**
   * Поиск БАДа по ID
   */
  static async findById(id: string): Promise<Supplement | null> {
    const supplement = await prisma.supplement.findUnique({
      where: { id },
    });

    return supplement;
  }

  /**
   * Получение всех БАДов с фильтрацией и пагинацией
   */
  static async findMany(
    page: number = 1,
    limit: number = 20,
    filters: SupplementFilters = {}
  ): Promise<{ supplements: Supplement[]; total: number }> {
    const skip = (page - 1) * limit;
    
    // Построение условий WHERE
    const where: any = {};

    // Поиск по названию и описанию
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Фильтр по тегам
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasEvery: filters.tags,
      };
    }

    // Фильтр по цене
    if (filters.priceRange) {
      where.price = {
        gte: filters.priceRange.min,
        lte: filters.priceRange.max,
      };
    }

    // Фильтр по наличию
    if (filters.inStock !== undefined) {
      where.inStock = filters.inStock;
    }

    const [supplements, total] = await Promise.all([
      prisma.supplement.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { inStock: 'desc' }, // Сначала доступные
          { name: 'asc' },
        ],
      }),
      prisma.supplement.count({ where }),
    ]);

    return { supplements, total };
  }

  /**
   * Обновление БАДа
   */
  static async update(id: string, supplementData: UpdateSupplementData): Promise<Supplement> {
    const supplement = await prisma.supplement.update({
      where: { id },
      data: supplementData,
    });

    return supplement;
  }

  /**
   * Удаление БАДа
   */
  static async delete(id: string): Promise<void> {
    await prisma.supplement.delete({
      where: { id },
    });
  }

  /**
   * Поиск БАДов по тегам (для рекомендаций)
   */
  static async findByTags(tags: string[], limit: number = 10): Promise<Supplement[]> {
    const supplements = await prisma.supplement.findMany({
      where: {
        tags: {
          hasSome: tags,
        },
        inStock: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return supplements;
  }

  /**
   * Получение популярных БАДов (по количеству в заказах)
   */
  static async findPopular(limit: number = 10): Promise<Supplement[]> {
    // В реальном проекте здесь был бы сложный запрос с подсчетом заказов
    // Пока возвращаем просто первые доступные БАДы
    const supplements = await prisma.supplement.findMany({
      where: { inStock: true },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return supplements;
  }

  /**
   * Получение всех уникальных тегов
   */
  static async getAllTags(): Promise<string[]> {
    const supplements = await prisma.supplement.findMany({
      select: { tags: true },
    });

    const allTags = supplements.flatMap(s => s.tags);
    const uniqueTags = [...new Set(allTags)].sort();

    return uniqueTags;
  }

  /**
   * Поиск похожих БАДов
   */
  static async findSimilar(supplementId: string, limit: number = 5): Promise<Supplement[]> {
    const supplement = await prisma.supplement.findUnique({
      where: { id: supplementId },
      select: { tags: true },
    });

    if (!supplement) {
      return [];
    }

    const similar = await prisma.supplement.findMany({
      where: {
        id: { not: supplementId },
        tags: {
          hasSome: supplement.tags,
        },
        inStock: true,
      },
      take: limit,
      orderBy: { name: 'asc' },
    });

    return similar;
  }

  /**
   * Получение статистики каталога
   */
  static async getStats() {
    const [total, inStock, outOfStock, avgPrice] = await Promise.all([
      prisma.supplement.count(),
      prisma.supplement.count({ where: { inStock: true } }),
      prisma.supplement.count({ where: { inStock: false } }),
      prisma.supplement.aggregate({
        _avg: { price: true },
      }),
    ]);

    return {
      total,
      inStock,
      outOfStock,
      averagePrice: Number(avgPrice._avg.price || 0),
    };
  }

  /**
   * Обновление остатков БАДа
   */
  static async updateStock(id: string, inStock: boolean): Promise<Supplement> {
    const supplement = await prisma.supplement.update({
      where: { id },
      data: { inStock },
    });

    return supplement;
  }
}

export default SupplementModel; 
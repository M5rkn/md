import { PrismaClient, File } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Интерфейсы для работы с файлами
export interface CreateFileData {
  formId: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
}

export interface FileWithForm extends File {
  form: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
}

/**
 * Модель для работы с загруженными файлами
 */
export class FileModel {
  /**
   * Создание записи о новом файле
   */
  static async create(fileData: CreateFileData): Promise<File> {
    const file = await prisma.file.create({
      data: {
        formId: fileData.formId,
        filename: fileData.filename,
        path: fileData.path,
        mimetype: fileData.mimetype,
        size: fileData.size,
      },
    });

    return file;
  }

  /**
   * Поиск файла по ID
   */
  static async findById(id: string): Promise<File | null> {
    const file = await prisma.file.findUnique({
      where: { id },
    });

    return file;
  }

  /**
   * Получение всех файлов для анкеты
   */
  static async findByFormId(formId: string): Promise<File[]> {
    const files = await prisma.file.findMany({
      where: { formId },
      orderBy: { uploadedAt: 'desc' },
    });

    return files;
  }

  /**
   * Получение файлов с информацией о пользователе
   */
  static async findWithUserInfo(formId: string): Promise<FileWithForm[]> {
    const files = await prisma.file.findMany({
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
      orderBy: { uploadedAt: 'desc' },
    });

    return files;
  }

  /**
   * Получение всех файлов с пагинацией
   */
  static async findMany(
    page: number = 1,
    limit: number = 20,
    filters: {
      mimetype?: string;
      dateFrom?: Date;
      dateTo?: Date;
      formId?: string;
    } = {}
  ): Promise<{ files: FileWithForm[]; total: number }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.mimetype) {
      where.mimetype = filters.mimetype;
    }

    if (filters.formId) {
      where.formId = filters.formId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.uploadedAt = {};
      if (filters.dateFrom) {
        where.uploadedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.uploadedAt.lte = filters.dateTo;
      }
    }

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where,
        skip,
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
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.file.count({ where }),
    ]);

    return { files, total };
  }

  /**
   * Удаление файла
   */
  static async delete(id: string): Promise<void> {
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (file) {
      // Удаляем физический файл
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.warn(`Не удалось удалить физический файл: ${file.path}`, error);
      }

      // Удаляем запись из БД
      await prisma.file.delete({
        where: { id },
      });
    }
  }

  /**
   * Удаление всех файлов для анкеты
   */
  static async deleteByFormId(formId: string): Promise<number> {
    const files = await prisma.file.findMany({
      where: { formId },
    });

    // Удаляем физические файлы
    for (const file of files) {
      try {
        await fs.unlink(file.path);
      } catch (error) {
        console.warn(`Не удалось удалить физический файл: ${file.path}`, error);
      }
    }

    // Удаляем записи из БД
    const result = await prisma.file.deleteMany({
      where: { formId },
    });

    return result.count;
  }

  /**
   * Получение статистики файлов
   */
  static async getStats(filters: {
    dateFrom?: Date;
    dateTo?: Date;
  } = {}) {
    const where: any = {};

    if (filters.dateFrom || filters.dateTo) {
      where.uploadedAt = {};
      if (filters.dateFrom) {
        where.uploadedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.uploadedAt.lte = filters.dateTo;
      }
    }

    const [
      totalFiles,
      totalSize,
      filesByType,
      averageSize,
    ] = await Promise.all([
      prisma.file.count({ where }),
      prisma.file.aggregate({
        where,
        _sum: { size: true },
      }),
      prisma.file.groupBy({
        by: ['mimetype'],
        where,
        _count: { mimetype: true },
        _sum: { size: true },
        orderBy: { _count: { mimetype: 'desc' } },
      }),
      prisma.file.aggregate({
        where,
        _avg: { size: true },
      }),
    ]);

    return {
      totalFiles,
      totalSize: totalSize._sum.size || 0,
      averageSize: Number(averageSize._avg.size || 0),
      filesByType: filesByType.map(item => ({
        mimetype: item.mimetype,
        count: item._count.mimetype,
        totalSize: item._sum.size || 0,
      })),
    };
  }

  /**
   * Проверка существования физического файла
   */
  static async checkFileExists(id: string): Promise<boolean> {
    const file = await prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      return false;
    }

    try {
      await fs.access(file.path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Получение информации о файле для скачивания
   */
  static async getDownloadInfo(id: string): Promise<{
    filename: string;
    path: string;
    mimetype: string;
    size: number;
  } | null> {
    const file = await prisma.file.findUnique({
      where: { id },
      select: {
        filename: true,
        path: true,
        mimetype: true,
        size: true,
      },
    });

    return file;
  }

  /**
   * Получение последних загруженных файлов
   */
  static async findRecent(limit: number = 10): Promise<FileWithForm[]> {
    const files = await prisma.file.findMany({
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
      orderBy: { uploadedAt: 'desc' },
    });

    return files;
  }

  /**
   * Поиск больших файлов
   */
  static async findLargeFiles(minSizeBytes: number = 10 * 1024 * 1024): Promise<FileWithForm[]> {
    const files = await prisma.file.findMany({
      where: {
        size: { gte: minSizeBytes },
      },
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
      orderBy: { size: 'desc' },
    });

    return files;
  }

  /**
   * Валидация данных файла
   */
  static validateFileData(data: any): data is CreateFileData {
    return (
      data &&
      typeof data.formId === 'string' &&
      typeof data.filename === 'string' &&
      typeof data.path === 'string' &&
      typeof data.mimetype === 'string' &&
      typeof data.size === 'number' &&
      data.size > 0
    );
  }

  /**
   * Получение разрешенных типов файлов
   */
  static getAllowedMimeTypes(): string[] {
    return [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
  }

  /**
   * Проверка разрешенного типа файла
   */
  static isAllowedMimeType(mimetype: string): boolean {
    return FileModel.getAllowedMimeTypes().includes(mimetype.toLowerCase());
  }

  /**
   * Генерация безопасного имени файла
   */
  static generateSafeFilename(originalFilename: string): string {
    const extension = path.extname(originalFilename);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `${timestamp}-${random}${extension}`;
  }
}

export default FileModel; 
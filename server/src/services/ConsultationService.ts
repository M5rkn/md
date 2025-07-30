import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ConsultationService {
  /**
   * Проверяет возможность бесплатной консультации
   */
  async checkFreeConsultationEligibility(userId: string): Promise<{
    eligible: boolean;
    message: string;
    lastConsultation?: Date;
  }> {
    try {
      // Получаем информацию о пользователе
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          phone: true,
          phoneVerified: true
        }
      });

      if (!user) {
        return {
          eligible: false,
          message: 'Пользователь не найден'
        };
      }

      // Проверяем наличие подтвержденного телефона
      if (!user.phone) {
        return {
          eligible: false,
          message: 'Для получения бесплатной консультации необходимо добавить номер телефона'
        };
      }

      if (!user.phoneVerified) {
        return {
          eligible: false,
          message: 'Для получения бесплатной консультации необходимо подтвердить номер телефона'
        };
      }

      // Дополнительная проверка: убеждаемся что номер все еще уникален
      const phoneOwner = await prisma.user.findFirst({
        where: {
          phone: user.phone,
          phoneVerified: true
        }
      });

      if (!phoneOwner || phoneOwner.id !== userId) {
        return {
          eligible: false,
          message: 'Номер телефона больше не привязан к вашему аккаунту или используется другим пользователем'
        };
      }

      // Проверяем использование консультации за последние 30 дней
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentConsultation = await prisma.consultationLog.findFirst({
        where: {
          userId,
          phone: user.phone,
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (recentConsultation) {
        return {
          eligible: false,
          message: 'Вы уже использовали бесплатную консультацию в этом месяце',
          lastConsultation: recentConsultation.createdAt
        };
      }

      return {
        eligible: true,
        message: 'Вы можете получить бесплатную консультацию'
      };

    } catch (error) {
      console.error('💥 Ошибка проверки консультации:', error);
      return {
        eligible: false,
        message: 'Ошибка проверки возможности консультации'
      };
    }
  }

  /**
   * Создает запись о бесплатной консультации
   */
  async logFreeConsultation(userId: string): Promise<{
    success: boolean;
    message: string;
    consultationId?: string;
  }> {
    try {
      // Получаем информацию о пользователе
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          phone: true,
          phoneVerified: true
        }
      });

      if (!user || !user.phone || !user.phoneVerified) {
        return {
          success: false,
          message: 'Номер телефона должен быть добавлен и подтвержден'
        };
      }

      // Создаем запись о консультации
      const consultation = await prisma.consultationLog.create({
        data: {
          userId,
          phone: user.phone
        }
      });

      console.log('📞 Записана бесплатная консультация:', {
        userId,
        phone: user.phone,
        consultationId: consultation.id
      });

      return {
        success: true,
        message: 'Консультация успешно записана',
        consultationId: consultation.id
      };

    } catch (error) {
      console.error('💥 Ошибка записи консультации:', error);
      return {
        success: false,
        message: 'Ошибка записи консультации'
      };
    }
  }

  /**
   * Получает историю консультаций пользователя
   */
  async getUserConsultationHistory(userId: string): Promise<{
    success: boolean;
    consultations: Array<{
      id: string;
      phone: string;
      createdAt: Date;
    }>;
    message?: string;
  }> {
    try {
      const consultations = await prisma.consultationLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          createdAt: true
        }
      });

      return {
        success: true,
        consultations
      };

    } catch (error) {
      console.error('💥 Ошибка получения истории консультаций:', error);
      return {
        success: false,
        consultations: [],
        message: 'Ошибка получения истории консультаций'
      };
    }
  }

  /**
   * Проверяет количество консультаций за период
   */
  async getConsultationCount(userId: string, days: number = 30): Promise<{
    count: number;
    period: string;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const count = await prisma.consultationLog.count({
        where: {
          userId,
          createdAt: {
            gte: startDate
          }
        }
      });

      return {
        count,
        period: `${days} дней`
      };

    } catch (error) {
      console.error('💥 Ошибка подсчета консультаций:', error);
      return {
        count: 0,
        period: `${days} дней`
      };
    }
  }
}

export const consultationService = new ConsultationService(); 
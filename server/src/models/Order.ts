import { PrismaClient, Order, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Интерфейсы для работы с заказами
export interface OrderItem {
  supplementId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface DeliveryInfo {
  address: {
    city: string;
    street: string;
    building: string;
    apartment?: string;
    postalCode: string;
  };
  phone: string;
  email: string;
  deliveryMethod: 'pickup' | 'courier' | 'post';
  comment?: string;
}

export interface CreateOrderData {
  userId: string;
  items: OrderItem[];
  deliveryInfo: DeliveryInfo;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  deliveryInfo?: DeliveryInfo;
}

export interface OrderWithUser extends Order {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * Модель заказов пользователей
 */
export class OrderModel {
  /**
   * Создание нового заказа
   */
  static async create(orderData: CreateOrderData): Promise<Order> {
    // Вычисляем общую стоимость
    const totalPrice = orderData.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );

    const order = await prisma.order.create({
      data: {
        userId: orderData.userId,
        items: orderData.items as any,
        totalPrice,
        deliveryInfo: orderData.deliveryInfo as any,
        status: 'PENDING',
      },
    });

    return order;
  }

  /**
   * Поиск заказа по ID
   */
  static async findById(id: string): Promise<OrderWithUser | null> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return order;
  }

  /**
   * Получение всех заказов пользователя
   */
  static async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ orders: Order[]; total: number }> {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({
        where: { userId },
      }),
    ]);

    return { orders, total };
  }

  /**
   * Получение всех заказов с фильтрацией
   */
  static async findMany(
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: OrderStatus;
      dateFrom?: Date;
      dateTo?: Date;
      userId?: string;
    } = {}
  ): Promise<{ orders: OrderWithUser[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total };
  }

  /**
   * Обновление заказа
   */
  static async update(id: string, orderData: UpdateOrderData): Promise<Order> {
    const updateData: any = {};

    if (orderData.status) {
      updateData.status = orderData.status;
    }

    if (orderData.deliveryInfo) {
      updateData.deliveryInfo = orderData.deliveryInfo as any;
    }

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
    });

    return order;
  }

  /**
   * Изменение статуса заказа
   */
  static async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return order;
  }

  /**
   * Отмена заказа
   */
  static async cancel(id: string): Promise<Order> {
    const order = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return order;
  }

  /**
   * Удаление заказа (только для админов)
   */
  static async delete(id: string): Promise<void> {
    await prisma.order.delete({
      where: { id },
    });
  }

  /**
   * Получение статистики заказов
   */
  static async getStats(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    userId?: string;
  } = {}) {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [
      totalOrders,
      totalRevenue,
      ordersByStatus,
      averageOrderValue,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { totalPrice: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      prisma.order.aggregate({
        where,
        _avg: { totalPrice: true },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.totalPrice || 0),
      averageOrderValue: Number(averageOrderValue._avg.totalPrice || 0),
      ordersByStatus: ordersByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<OrderStatus, number>),
    };
  }

  /**
   * Получение последних заказов
   */
  static async findRecent(limit: number = 10): Promise<OrderWithUser[]> {
    const orders = await prisma.order.findMany({
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  /**
   * Валидация товаров в заказе
   */
  static validateOrderItems(items: any[]): items is OrderItem[] {
    return (
      Array.isArray(items) &&
      items.every(item =>
        typeof item.supplementId === 'string' &&
        typeof item.name === 'string' &&
        typeof item.price === 'number' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0 &&
        item.price >= 0
      )
    );
  }

  /**
   * Валидация информации о доставке
   */
  static validateDeliveryInfo(deliveryInfo: any): deliveryInfo is DeliveryInfo {
    return (
      deliveryInfo &&
      deliveryInfo.address &&
      typeof deliveryInfo.address.city === 'string' &&
      typeof deliveryInfo.address.street === 'string' &&
      typeof deliveryInfo.phone === 'string' &&
      typeof deliveryInfo.email === 'string' &&
      ['pickup', 'courier', 'post'].includes(deliveryInfo.deliveryMethod)
    );
  }
}

export default OrderModel; 
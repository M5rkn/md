import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Интерфейсы для создания и обновления пользователя
export interface CreateUserData {
  name?: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}

/**
 * Модель пользователя с методами для работы с базой данных
 */
export class UserModel {
  /**
   * Создание нового пользователя с хешированием пароля
   */
  static async create(userData: CreateUserData): Promise<UserWithoutPassword> {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Поиск пользователя по ID
   */
  static async findById(id: string): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Поиск пользователя по email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user;
  }

  /**
   * Поиск пользователя по email без пароля
   */
  static async findByEmailWithoutPassword(email: string): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Обновление данных пользователя
   */
  static async update(id: string, userData: UpdateUserData): Promise<UserWithoutPassword> {
    const updateData: any = { ...userData };
    
    // Хешируем пароль, если он предоставлен
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 12);
    }

    if (userData.email) {
      updateData.email = userData.email.toLowerCase();
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Удаление пользователя
   */
  static async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Получение всех пользователей с пагинацией
   */
  static async findMany(
    page: number = 1,
    limit: number = 10,
    role?: UserRole
  ): Promise<{ users: UserWithoutPassword[]; total: number }> {
    const where = role ? { role } : {};
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  /**
   * Проверка существования пользователя по email
   */
  static async existsByEmail(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    return !!user;
  }

  /**
   * Верификация пароля пользователя
   */
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  /**
   * Получение статистики пользователя
   */
  static async getUserStats(userId: string) {
    const [formsCount, ordersCount, totalSpent] = await Promise.all([
      prisma.form.count({
        where: { userId },
      }),
      prisma.order.count({
        where: { userId },
      }),
      prisma.order.aggregate({
        where: { userId },
        _sum: { totalPrice: true },
      }),
    ]);

    return {
      formsCompleted: formsCount,
      ordersPlaced: ordersCount,
      totalSpent: totalSpent._sum.totalPrice || 0,
    };
  }
}

export default UserModel; 
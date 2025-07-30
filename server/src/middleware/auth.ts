import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
}

// Расширяем тип Request для добавления userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Токен доступа не предоставлен'
      });
    }

    const token = authHeader.substring(7); // Убираем 'Bearer '
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Токен доступа не предоставлен'
      });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JwtPayload;
    
    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }

    // Добавляем данные пользователя в запрос
    req.userId = user.id;
    req.user = user;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Недействительный токен'
      });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Токен истёк'
      });
    }

    console.error('Ошибка middleware аутентификации:', error);
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    });
  }
};

// Middleware для проверки ролей
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Недостаточно прав доступа'
      });
    }

    next();
  };
}; 
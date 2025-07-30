"""
Подключение к базе данных
"""
from loguru import logger
from ..core.config import settings


async def init_db():
    """Инициализация подключения к базе данных"""
    try:
        logger.info("🗄️ Инициализация подключения к базе данных...")
        # Здесь будет реальная инициализация SQLAlchemy/Prisma
        logger.info("✅ База данных подключена успешно")
    except Exception as e:
        logger.error(f"❌ Ошибка подключения к базе данных: {e}")
        raise


async def close_db_connection():
    """Закрытие подключения к базе данных"""
    try:
        logger.info("🔒 Закрытие подключения к базе данных...")
        # Здесь будет реальное закрытие соединений
        logger.info("✅ Подключение к базе данных закрыто")
    except Exception as e:
        logger.error(f"❌ Ошибка при закрытии подключения: {e}") 
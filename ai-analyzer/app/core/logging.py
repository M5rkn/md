"""
Настройка логирования
"""
import sys
from loguru import logger
from .config import settings


def setup_logging():
    """Настройка системы логирования"""
    
    # Удаляем стандартный handler
    logger.remove()
    
    # Добавляем новый handler с настройками
    logger.add(
        sys.stdout,
        level=settings.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True
    )
    
    # Логирование в файл для production
    if settings.ENVIRONMENT == "production":
        logger.add(
            "logs/app.log",
            rotation="1 day",
            retention="30 days",
            level="INFO",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}"
        )
    
    logger.info(f"🚀 Логирование настроено для окружения: {settings.ENVIRONMENT}") 
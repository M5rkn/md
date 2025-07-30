"""
Основной файл FastAPI приложения для ИИ-анализатора медицинских анкет
"""
import os
import sys
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

# Добавляем путь к модулям приложения
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.api.routes import api_router
from app.core.config import settings
from app.core.exceptions import setup_exception_handlers
from app.core.logging import setup_logging
from app.database.connection import init_db, close_db_connection


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Управление жизненным циклом приложения
    """
    # Настройка логирования
    setup_logging()
    logger.info("🚀 Запуск ИИ-анализатора медицинских анкет")
    
    # Инициализация базы данных
    await init_db()
    logger.info("✅ База данных инициализирована")
    
    # Проверка подключения к DeepSeek API
    if settings.DEEPSEEK_API_KEY:
        logger.info("✅ DeepSeek API ключ настроен")
    else:
        logger.warning("⚠️ DeepSeek API ключ не настроен - используется rule-based анализ")
    
    yield
    
    # Закрытие соединений при завершении
    await close_db_connection()
    logger.info("👋 ИИ-анализатор остановлен")


# Создание FastAPI приложения
app = FastAPI(
    title="Medical AI Analyzer",
    description="ИИ-микросервис для анализа медицинских анкет и рекомендаций по БАДам",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Trusted Host middleware для безопасности
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

# Настройка обработчиков исключений
setup_exception_handlers(app)

# Подключение API роутов
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Health"])
async def root():
    """
    Корневой эндпоинт для проверки работоспособности
    """
    return {
        "message": "ИИ-анализатор медицинских анкет",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else None,
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """
    Проверка здоровья сервиса
    """
    return {
        "status": "healthy",
        "service": "ai-analyzer",
        "version": "1.0.0",
        "debug": settings.DEBUG,
        "ai_configured": bool(settings.DEEPSEEK_API_KEY),
    }


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware для логирования всех HTTP запросов
    """
    start_time = time.time()
    
    # Логируем входящий запрос
    logger.info(
        f"Запрос: {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.query_params),
            "client_ip": request.client.host,
        }
    )
    
    # Обрабатываем запрос
    response = await call_next(request)
    
    # Вычисляем время обработки
    process_time = time.time() - start_time
    
    # Логируем ответ
    logger.info(
        f"Ответ: {response.status_code}",
        extra={
            "status_code": response.status_code,
            "process_time": round(process_time, 4),
        }
    )
    
    # Добавляем заголовок с временем обработки
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


if __name__ == "__main__":
    import time
    import uvicorn
    
    # Запуск сервера
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning",
        access_log=settings.DEBUG,
    ) 
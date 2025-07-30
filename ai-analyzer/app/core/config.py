"""
Конфигурация приложения
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Настройки приложения"""
    
    # Основные настройки
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    DEBUG: bool = True
    
    # База данных
    DATABASE_URL: str = "postgresql://medical_user:medical_password@localhost:5432/medical_aggregator"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # DeepSeek API (единственный AI провайдер)
    DEEPSEEK_API_KEY: Optional[str] = None
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com/v1"
    DEEPSEEK_MODEL: str = "deepseek-chat"
    DEEPSEEK_MAX_TOKENS: int = 2000
    DEEPSEEK_TEMPERATURE: float = 0.3
    DEEPSEEK_TIMEOUT: int = 30
    
    # Настройки CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:3001", "https://*.railway.app"]
    ALLOWED_HOSTS: list = ["localhost", "127.0.0.1", "*.railway.app", "*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings() 
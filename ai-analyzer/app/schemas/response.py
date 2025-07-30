from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

# Схема для рекомендуемого БАДа в hash map
class SupplementRecommendation(BaseModel):
    """Рекомендация по БАДу"""
    name: str = Field(..., description="Название БАДа")
    dose: str = Field(..., description="Дозировка (например: '1 капсула 2 раза в день')")
    duration: str = Field(..., description="Длительность приема (например: '1 месяц')")
    priority: str = Field(..., description="Приоритет: 'high', 'medium', 'low'")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Уверенность ИИ (0-1)")

# Основная схема ответа ИИ-анализатора согласно требованиям заказчика
class AIAnalysisResponse(BaseModel):
    """
    Ответ ИИ-анализатора в формате:
    hash map с рекомендованными БАДами + текст с рекомендациями
    """
    
    # Hash map с рекомендованными БАДами (ключ - ID БАДа, значение - рекомендация)
    recommended_supplements: Dict[str, SupplementRecommendation] = Field(
        ..., 
        description="Hash map с рекомендованными БАДами"
    )
    
    # Текст с рекомендациями
    recommendations_text: str = Field(
        ..., 
        description="Подробный текст с рекомендациями от ИИ"
    )
    
    # Метаданные анализа
    analysis_id: str = Field(..., description="ID анализа")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0, description="Общая уверенность анализа")
    processing_time_ms: int = Field(default=0, description="Время обработки в миллисекундах")
    created_at: datetime = Field(default_factory=datetime.now, description="Время создания")

class AnalysisRequest(BaseModel):
    """Запрос на анализ медицинской анкеты"""
    form_id: str = Field(..., description="ID медицинской анкеты")
    user_id: str = Field(..., description="ID пользователя")
    answers: Dict[str, Any] = Field(..., description="Ответы на анкету в формате JSON")
    priority: Optional[str] = Field(default="normal", description="Приоритет анализа")

class AnalysisStatus(BaseModel):
    """Статус анализа"""
    analysis_id: str
    status: str = Field(..., description="pending, processing, completed, failed")
    progress: int = Field(default=0, ge=0, le=100, description="Прогресс в процентах")
    message: Optional[str] = Field(None, description="Сообщение о статусе")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

# Схемы для error responses
class ErrorResponse(BaseModel):
    """Стандартный ответ об ошибке"""
    success: bool = False
    error: str = Field(..., description="Сообщение об ошибке")
    error_code: Optional[str] = Field(None, description="Код ошибки")
    details: Optional[Dict[str, Any]] = Field(None, description="Дополнительные детали")

class SuccessResponse(BaseModel):
    """Стандартный успешный ответ"""
    success: bool = True
    data: Any = Field(..., description="Данные ответа")
    message: Optional[str] = Field(None, description="Дополнительное сообщение")

# Схемы для работы с каталогом БАДов
class SupplementInfo(BaseModel):
    """Информация о БАДе из каталога"""
    id: str = Field(..., description="ID БАДа")
    name: str = Field(..., description="Название")
    description: str = Field(..., description="Описание")
    tags: List[str] = Field(default_factory=list, description="Теги")
    price: Optional[float] = Field(None, description="Цена")
    in_stock: bool = Field(default=True, description="Наличие на складе")

# Схема для объяснения рекомендаций
class RecommendationExplanation(BaseModel):
    """Объяснение рекомендаций"""
    reasoning: str = Field(..., description="Обоснование рекомендации")
    contraindications: List[str] = Field(default_factory=list, description="Противопоказания")
    interactions: List[str] = Field(default_factory=list, description="Взаимодействия с препаратами")
    safety_notes: List[str] = Field(default_factory=list, description="Замечания по безопасности")

# Расширенная схема ответа с объяснениями (для внутреннего использования)
class DetailedAnalysisResponse(AIAnalysisResponse):
    """Детальный ответ с объяснениями"""
    explanations: Dict[str, RecommendationExplanation] = Field(
        default_factory=dict,
        description="Объяснения для каждого БАДа"
    )
    
    methodology: str = Field(
        default="",
        description="Методология анализа"
    )
    
    limitations: str = Field(
        default="Рекомендации носят информационный характер и не заменяют консультацию врача",
        description="Ограничения и предупреждения"
    )

# Схема для пакетного анализа
class BatchAnalysisRequest(BaseModel):
    """Запрос на пакетный анализ"""
    requests: List[AnalysisRequest] = Field(..., min_items=1, max_items=10)
    batch_id: Optional[str] = Field(None, description="ID пакета")

class BatchAnalysisResponse(BaseModel):
    """Ответ пакетного анализа"""
    batch_id: str
    results: List[AIAnalysisResponse]
    failed_analyses: List[Dict[str, str]] = Field(default_factory=list)
    total_processed: int
    processing_time_ms: int

# Схемы для валидации входных данных
class FormAnswersValidation(BaseModel):
    """Валидация ответов анкеты"""
    age: Optional[int] = Field(None, ge=0, le=120)
    gender: Optional[str] = Field(None, pattern="^(male|female|other)$")
    weight: Optional[float] = Field(None, ge=20, le=300)  # кг
    height: Optional[int] = Field(None, ge=100, le=250)   # см
    chronic_diseases: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None
    symptoms: Optional[List[str]] = None
    lifestyle: Optional[Dict[str, Any]] = None
    goals: Optional[List[str]] = None

# Схема для кэширования результатов
class CachedAnalysis(BaseModel):
    """Кэшированный результат анализа"""
    cache_key: str
    result: AIAnalysisResponse
    cached_at: datetime
    expires_at: datetime
    hit_count: int = 0 
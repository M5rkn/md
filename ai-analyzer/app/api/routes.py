"""
API роуты для ИИ-анализатора
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from loguru import logger

from app.services.ai_service import AIAnalysisService
from app.schemas.response import AnalysisRequest

api_router = APIRouter()


class HealthResponse(BaseModel):
    """Ответ health check"""
    success: bool
    message: str
    status: str


class AnalysisRequestAPI(BaseModel):
    """Запрос на анализ анкеты от сервера"""
    form_data: Dict[str, Any]
    user_id: str


class AnalysisResponse(BaseModel):
    """Ответ анализа"""
    success: bool
    recommendations: list
    analysis: Dict[str, Any]


@api_router.get("/", response_model=Dict[str, str])
async def root():
    """Корневой endpoint"""
    return {"message": "AI Analyzer Service v1.0"}


@api_router.get("/health", response_model=HealthResponse)
async def health_check():
    """Проверка состояния сервиса"""
    logger.info("Health check requested")
    return HealthResponse(
        success=True,
        message="AI Analyzer Service is running",
        status="healthy"
    )


@api_router.post("/analyze", response_model=AnalysisResponse)
async def analyze_form(request: AnalysisRequestAPI):
    """Анализ медицинской анкеты с помощью DeepSeek AI"""
    try:
        logger.info(f"🧠 Analysis requested for user {request.user_id}")
        logger.info(f"📝 Form data received: {list(request.form_data.keys())}")
        
        # Создаем экземпляр AI сервиса
        ai_service = AIAnalysisService()
        
        # Преобразуем данные в формат AnalysisRequest
        analysis_request = AnalysisRequest(
            form_id=f"form_{request.user_id}",
            user_id=request.user_id,
            answers=request.form_data
        )
        
        # Выполняем реальный анализ с помощью DeepSeek
        logger.info("🚀 Calling DeepSeek API for analysis...")
        ai_result = await ai_service.analyze_medical_form(analysis_request)
        
        # Преобразуем результат в формат API ответа
        recommendations = []
        
        # Проверяем тип результата (AIAnalysisResponse или fallback)
        if hasattr(ai_result, 'recommended_supplements'):
            # Обычный AI анализ
            for supp_rec in ai_result.recommended_supplements:
                recommendations.append({
                    "supplement_id": getattr(supp_rec, 'supplement_id', f"ai_{len(recommendations)}"),
                    "name": supp_rec.name,
                    "reason": supp_rec.reason,
                    "dosage": supp_rec.dosage,
                    "confidence": getattr(supp_rec, 'confidence', 0.85)
                })
            
            analysis_data = {
                "health_score": int(ai_result.confidence * 100),
                "risk_factors": ["Анализ выполнен ИИ"],
                "recommendations_count": len(recommendations)
            }
        else:
            # Fallback анализ (возвращает dict)
            if isinstance(ai_result, dict) and 'supplements' in ai_result:
                for supp_id, supp_rec in ai_result['supplements'].items():
                    recommendations.append({
                        "supplement_id": supp_id,
                        "name": supp_rec.name if hasattr(supp_rec, 'name') else supp_rec.get('name', ''),
                        "reason": supp_rec.reason if hasattr(supp_rec, 'reason') else supp_rec.get('reason', ''),
                        "dosage": supp_rec.dosage if hasattr(supp_rec, 'dosage') else supp_rec.get('dosage', ''),
                        "confidence": getattr(supp_rec, 'confidence', supp_rec.get('confidence', 0.7))
                    })
                
                analysis_data = {
                    "health_score": int(ai_result.get('confidence', 0.7) * 100),
                    "risk_factors": ["Анализ выполнен (DeepSeek недоступен - недостаточно средств)"],
                    "recommendations_count": len(recommendations)
                }
            else:
                # Совсем простой fallback
                recommendations = [{
                    "supplement_id": "emergency_fallback",
                    "name": "Мультивитамины",
                    "reason": "Базовая поддержка организма",
                    "dosage": "1 капсула в день",
                    "confidence": 0.6
                }]
                
                analysis_data = {
                    "health_score": 60,
                    "risk_factors": ["Ошибка ИИ анализа - недостаточно средств на DeepSeek"],
                    "recommendations_count": 1
                }
        
        logger.info(f"✅ Analysis completed: {len(recommendations)} recommendations")
        
        return AnalysisResponse(
            success=True,
            recommendations=recommendations,
            analysis=analysis_data
        )
        
    except Exception as e:
        logger.error(f"❌ Analysis failed: {str(e)}")
        logger.exception("Full error details:")
        
        # Возвращаем fallback рекомендации при ошибке
        fallback_recommendations = [
            {
                "supplement_id": "fallback_001",
                "name": "Мультивитамины",
                "reason": "Базовая поддержка организма (fallback)",
                "dosage": "1 капсула в день",
                "confidence": 0.7
            }
        ]
        
        return AnalysisResponse(
            success=True,
            recommendations=fallback_recommendations,
            analysis={
                "health_score": 70,
                "risk_factors": ["Ошибка ИИ анализа"],
                "recommendations_count": len(fallback_recommendations)
            }
        ) 
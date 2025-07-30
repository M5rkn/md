import json
import asyncio
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import openai
from loguru import logger

from app.core.config import settings
from app.schemas.response import (
    AIAnalysisResponse, 
    SupplementRecommendation, 
    AnalysisRequest,
    FormAnswersValidation
)
from app.services.database_service import DatabaseService
from app.services.cache_service import CacheService

class AIAnalysisService:
    """Сервис для ИИ-анализа медицинских анкет"""
    
    def __init__(self):
        # DeepSeek клиент (единственный AI провайдер)
        if settings.DEEPSEEK_API_KEY:
            logger.info(f"🔑 DeepSeek API ключ найден: {settings.DEEPSEEK_API_KEY[:8]}...")
            logger.info(f"🌐 DeepSeek URL: {settings.DEEPSEEK_BASE_URL}")
            self.deepseek_client = openai.AsyncOpenAI(
                api_key=settings.DEEPSEEK_API_KEY,
                base_url=settings.DEEPSEEK_BASE_URL
            )
        else:
            logger.warning("⚠️ DeepSeek API ключ не найден - только rule-based анализ")
            self.deepseek_client = None
        
        self.db_service = DatabaseService()
        self.cache_service = CacheService()
        
    async def analyze_medical_form(self, request: AnalysisRequest) -> AIAnalysisResponse:
        """
        Основной метод анализа медицинской анкеты
        Возвращает hash map с БАДами + текст рекомендаций согласно требованиям заказчика
        """
        start_time = datetime.now()
        
        try:
            # Проверяем кэш
            cache_key = self._generate_cache_key(request.answers)
            cached_result = await self.cache_service.get_analysis(cache_key)
            
            if cached_result:
                logger.info(f"Returning cached analysis for form {request.form_id}")
                return cached_result
            
            # Валидация входных данных
            validated_answers = self._validate_form_answers(request.answers)
            
            # Получаем каталог БАДов из базы данных
            supplements_catalog = await self.db_service.get_supplements_catalog()
            
            # Анализ через DeepSeek API
            analysis_result = await self._analyze_with_ai(
                validated_answers, 
                supplements_catalog
            )
            
            # Формируем ответ в требуемом формате
            processing_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            response = AIAnalysisResponse(
                analysis_id=f"analysis_{request.form_id}_{int(datetime.now().timestamp())}",
                recommended_supplements=analysis_result["supplements"],
                recommendations_text=analysis_result["text"],
                confidence=analysis_result["confidence"],
                processing_time_ms=processing_time
            )
            
            # Сохраняем результат в кэш
            await self.cache_service.store_analysis(cache_key, response)
            
            # Сохраняем в базу данных
            await self.db_service.save_analysis_result(
                request.form_id,
                request.user_id,
                response
            )
            
            logger.info(f"Analysis completed for form {request.form_id} in {processing_time}ms")
            return response
            
        except Exception as e:
            logger.error(f"Analysis failed for form {request.form_id}: {str(e)}")
            # Возвращаем пустой ответ в случае ошибки
            return AIAnalysisResponse(
                analysis_id=f"failed_{request.form_id}",
                recommended_supplements={},
                recommendations_text="К сожалению, произошла ошибка при анализе анкеты. Пожалуйста, обратитесь к специалисту.",
                confidence=0.0,
                processing_time_ms=int((datetime.now() - start_time).total_seconds() * 1000)
            )
    
    async def _analyze_with_ai(
        self, 
        form_answers: Dict[str, Any], 
        supplements_catalog: List[Dict]
    ) -> Dict[str, Any]:
        """Анализ через DeepSeek API"""
        
        # Подготавливаем промпт для ИИ
        prompt = self._build_analysis_prompt(form_answers, supplements_catalog)
        
        system_message = """Ты - медицинский ИИ-консультант, специализирующийся на общих рекомендациях по здоровью. 
        Анализируй медицинские анкеты и давай общие рекомендации по образу жизни и питанию.
        
        ВАЖНО: Отвечай СТРОГО в JSON формате:
        {
            "recommendations": {
                "rec_1": {
                    "name": "Название рекомендации",
                    "dosage": "Рекомендация по применению",
                    "priority": "high",
                    "reason": "Причина рекомендации"
                }
            },
            "text": "Подробный текст с рекомендациями...",
            "confidence": 0.85
        }
        
        Никогда не ставь медицинские диагнозы. Всегда указывай, что нужна консультация врача."""
        
        # Пробуем DeepSeek
        if self.deepseek_client:
            try:
                logger.info("🧠 Отправляем запрос в DeepSeek API...")
                logger.info(f"📝 Модель: {settings.DEEPSEEK_MODEL}")
                logger.info(f"🔧 Параметры: max_tokens={settings.DEEPSEEK_MAX_TOKENS}, temp={settings.DEEPSEEK_TEMPERATURE}")
                logger.info(f"📊 Размер промпта: {len(prompt)} символов")
                
                response = await self.deepseek_client.chat.completions.create(
                    model=settings.DEEPSEEK_MODEL,
                    messages=[
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=settings.DEEPSEEK_MAX_TOKENS,
                    temperature=settings.DEEPSEEK_TEMPERATURE,
                    timeout=settings.DEEPSEEK_TIMEOUT
                )
                
                logger.info("✅ Получен ответ от DeepSeek API")
                
                # Парсим ответ DeepSeek
                ai_response = response.choices[0].message.content
                logger.info(f"📄 Ответ DeepSeek: {ai_response[:200]}...")
                
                # Пытаемся распарсить JSON
                try:
                    analysis_data = json.loads(ai_response)
                    logger.info("✅ JSON успешно распарсен")
                except json.JSONDecodeError as json_error:
                    logger.error(f"❌ Ошибка парсинга JSON от DeepSeek: {json_error}")
                    logger.error(f"🔍 Полный ответ: {ai_response}")
                    raise
                
                logger.info("✅ DeepSeek анализ успешно завершен")
                return self._process_ai_response(analysis_data)
                
            except Exception as e:
                logger.error(f"❌ DeepSeek API error: {e}")
                logger.error(f"🔍 Тип ошибки: {type(e).__name__}")
                logger.info("🔧 Переключаемся на rule-based анализ...")
        else:
            logger.warning("⚠️ DeepSeek клиент не инициализирован")
        
        # Если DeepSeek недоступен - используем rule-based анализ
        logger.warning("🔧 Используем rule-based анализ (DeepSeek недоступен)")
        return await self._fallback_rule_based_analysis(form_answers, supplements_catalog)
    
    def _process_ai_response(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Обрабатываем ответ от AI API"""
        recommendations_dict = {}
        
        for rec_id, rec_data in analysis_data.get("recommendations", {}).items():
            recommendations_dict[rec_id] = SupplementRecommendation(
                name=rec_data.get("name", ""),
                dosage=rec_data.get("dosage", ""),
                priority=rec_data.get("priority", "medium"),
                reason=rec_data.get("reason", "")
            )
        
        return {
            "supplements": recommendations_dict,
            "text": analysis_data.get("text", "Рекомендации недоступны"),
            "confidence": analysis_data.get("confidence", 0.7)
        }
    
    def _build_analysis_prompt(
        self, 
        form_answers: Dict[str, Any], 
        supplements_catalog: List[Dict]
    ) -> str:
        """Строим промпт для ИИ"""
        
        # Базовая информация о пользователе
        user_info = f"""
        Анализируемые данные пользователя:
        - Возраст: {form_answers.get('age', 'не указан')}
        - Пол: {form_answers.get('gender', 'не указан')}
        - Вес: {form_answers.get('weight', 'не указан')} кг
        - Рост: {form_answers.get('height', 'не указан')} см
        - Хронические заболевания: {', '.join(form_answers.get('chronic_diseases', [])) or 'нет'}
        - Текущие лекарства: {', '.join(form_answers.get('current_medications', [])) or 'нет'}
        - Симптомы: {', '.join(form_answers.get('symptoms', [])) or 'нет'}
        - Цели: {', '.join(form_answers.get('goals', [])) or 'не указаны'}
        """
        
        # Каталог доступных БАДов
        catalog_info = "\nДоступные БАДы:\n"
        for supplement in supplements_catalog[:20]:  # Ограничиваем для промпта
            catalog_info += f"- ID: {supplement['id']}, Название: {supplement['name']}, "
            catalog_info += f"Описание: {supplement['description']}, Теги: {', '.join(supplement.get('tags', []))}\n"
        
        instructions = """
        
        Задача:
        1. Проанализируй данные пользователя
        2. Выбери 3-5 наиболее подходящих БАДов из каталога
        3. Для каждого БАДа укажи дозировку и длительность приема
        4. Напиши подробный текст с рекомендациями (200-400 слов)
        5. Обязательно упомяни необходимость консультации с врачом
        
        Принципы подбора:
        - Учитывай возраст, пол, симптомы и цели
        - Избегай БАДов с противопоказаниями
        - Отдавай приоритет безопасным и базовым БАДам
        - Не рекомендуй БАДы без четких показаний
        """
        
        return user_info + catalog_info + instructions
    
    async def _fallback_rule_based_analysis(
        self,
        form_answers: Dict[str, Any],
        supplements_catalog: List[Dict]
    ) -> Dict[str, Any]:
        """Резервный rule-based анализ"""
        
        logger.info("Using fallback rule-based analysis")
        
        # Базовые правила подбора БАДов
        recommended_supplements = {}
        
        age = form_answers.get('age', 30)
        gender = form_answers.get('gender', 'unknown')
        symptoms = form_answers.get('symptoms', [])
        goals = form_answers.get('goals', [])
        
        # Правило 1: Базовая поддержка для всех
        basic_supplements = [
            {'id': 'vitamin_d3', 'name': 'Витамин D3', 'priority': 'high'},
            {'id': 'omega_3', 'name': 'Омега-3', 'priority': 'medium'},
            {'id': 'magnesium', 'name': 'Магний', 'priority': 'medium'}
        ]
        
        for supp in basic_supplements:
            if any(cat_supp['name'].lower() in supp['name'].lower() 
                   for cat_supp in supplements_catalog):
                recommended_supplements[supp['id']] = SupplementRecommendation(
                    name=supp['name'],
                    dose="По инструкции",
                    duration="1-2 месяца",
                    priority=supp['priority'],
                    confidence=0.7
                )
        
        # Правило 2: Специфические рекомендации по симптомам
        if 'усталость' in symptoms or 'упадок сил' in symptoms:
            recommended_supplements['b_complex'] = SupplementRecommendation(
                name="Витамины группы B",
                dose="1 капсула утром",
                duration="1 месяц",
                priority="high",
                confidence=0.8
            )
        
        # Текст рекомендаций
        recommendations_text = f"""
        На основе анализа вашей анкеты подобраны следующие БАДы:
        
        {', '.join([supp.name for supp in recommended_supplements.values()])}
        
        Рекомендации составлены с учетом ваших индивидуальных особенностей и целей. 
        Данные БАДы могут помочь восполнить недостаток важных витаминов и минералов.
        
        ВАЖНО: Данные рекомендации носят информационный характер и не заменяют 
        консультацию с врачом. Перед началом приема БАДов обязательно проконсультируйтесь 
        со специалистом, особенно если у вас есть хронические заболевания или вы 
        принимаете лекарства.
        
        Рекомендуется проконсультироваться с врачом через 1 месяц приема для оценки эффективности.
        """
        
        return {
            "supplements": recommended_supplements,
            "text": recommendations_text.strip(),
            "confidence": 0.6
        }
    
    def _validate_form_answers(self, answers: Dict[str, Any]) -> Dict[str, Any]:
        """Валидация и нормализация ответов анкеты"""
        try:
            validated = FormAnswersValidation(**answers)
            return validated.dict(exclude_none=True)
        except Exception as e:
            logger.warning(f"Form validation failed: {e}, using raw answers")
            return answers
    
    def _generate_cache_key(self, answers: Dict[str, Any]) -> str:
        """Генерация ключа кэша на основе ответов"""
        answers_str = json.dumps(answers, sort_keys=True)
        return hashlib.md5(answers_str.encode()).hexdigest()
    
    async def get_analysis_status(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """Получение статуса анализа"""
        return await self.db_service.get_analysis_status(analysis_id)
    
    async def explain_recommendation(
        self, 
        analysis_id: str, 
        supplement_id: str
    ) -> Optional[str]:
        """Объяснение конкретной рекомендации"""
        analysis = await self.db_service.get_analysis_by_id(analysis_id)
        if not analysis:
            return None
            
        # Запрос объяснения у DeepSeek
        if not self.deepseek_client:
            return "Объяснение недоступно - DeepSeek API не настроен."
            
        try:
            response = await self.deepseek_client.chat.completions.create(
                model=settings.DEEPSEEK_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "Объясни почему был рекомендован данный БАД на основе анализа. Будь конкретным и понятным."
                    },
                    {
                        "role": "user",
                        "content": f"Объясни рекомендацию БАДа {supplement_id} для анализа {analysis_id}"
                    }
                ],
                max_tokens=300,
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Failed to explain recommendation: {e}")
            return "Объяснение недоступно." 
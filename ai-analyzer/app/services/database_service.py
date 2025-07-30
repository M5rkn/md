"""
Заглушка для DatabaseService
"""
from typing import List, Dict, Any, Optional


class DatabaseService:
    """Заглушка для сервиса базы данных"""
    
    def __init__(self):
        pass
    
    async def get_supplements_catalog(self) -> List[Dict]:
        """Возвращает каталог БАДов"""
        return [
            {
                "id": "vitamin_d3",
                "name": "Витамин D3",
                "description": "Поддержка иммунной системы и костей",
                "category": "vitamins",
                "recommended_dose": "2000 МЕ в день"
            },
            {
                "id": "omega_3",
                "name": "Омега-3",
                "description": "Поддержка сердечно-сосудистой системы",
                "category": "fatty_acids",
                "recommended_dose": "1000 мг в день"
            },
            {
                "id": "magnesium",
                "name": "Магний",
                "description": "Улучшение качества сна и снятие стресса",
                "category": "minerals",
                "recommended_dose": "400 мг в день"
            },
            {
                "id": "vitamin_b12",
                "name": "Витамин B12",
                "description": "Поддержка нервной системы и энергии",
                "category": "vitamins",
                "recommended_dose": "1000 мкг в день"
            },
            {
                "id": "zinc",
                "name": "Цинк",
                "description": "Поддержка иммунитета и заживления",
                "category": "minerals",
                "recommended_dose": "15 мг в день"
            }
        ]
    
    async def save_analysis_result(self, analysis_id: str, result: Dict[str, Any], user_id: str = None) -> bool:
        """Сохраняет результат анализа (заглушка)"""
        print(f"📝 [DATABASE] Сохранение анализа {analysis_id}")
        return True
    
    async def get_analysis_status(self, analysis_id: str) -> Optional[Dict]:
        """Получает статус анализа (заглушка)"""
        return {"status": "completed", "progress": 100}
    
    async def get_analysis_by_id(self, analysis_id: str) -> Optional[Dict]:
        """Получает анализ по ID (заглушка)"""
        return None 
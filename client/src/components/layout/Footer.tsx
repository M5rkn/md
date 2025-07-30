import React from 'react';
import { Heart, Shield, Users } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* О проекте */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Медицинский агрегатор</h3>
            <p className="text-gray-600 text-sm">
              Персонализированные рекомендации по приёму БАДов на основе ИИ-анализа медицинских анкет.
            </p>
            <div className="flex items-center space-x-2 text-primary-600">
              <Heart size={16} />
              <span className="text-sm">Забота о вашем здоровье</span>
            </div>
          </div>

          {/* Услуги */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Услуги</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• ИИ-анализ анкет</li>
              <li>• Персональные рекомендации</li>
              <li>• Оценка рисков</li>
              <li>• Мониторинг здоровья</li>
            </ul>
          </div>

          {/* Безопасность */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Безопасность</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <Shield size={14} />
                <span>Защита данных</span>
              </li>
              <li className="flex items-center space-x-2">
                <Users size={14} />
                <span>Конфиденциальность</span>
              </li>
              <li>• GDPR соответствие</li>
              <li>• Медицинские стандарты</li>
            </ul>
          </div>

          {/* Контакты */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Контакты</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>support@medical-aggregator.com</p>
              <p>+7 (800) 123-45-67</p>
              <p className="text-xs mt-4 text-gray-500">
                Круглосуточная поддержка
              </p>
            </div>
          </div>
        </div>

        {/* Нижняя часть */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500">
              © 2025 Медицинский агрегатор. Все права защищены.
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <button className="hover:text-primary-600 transition-colors">
                Политика конфиденциальности
              </button>
              <button className="hover:text-primary-600 transition-colors">
                Условия использования  
              </button>
              <button className="hover:text-primary-600 transition-colors">
                Медицинская оговорка
              </button>
            </div>
          </div>
          
          {/* Медицинская оговорка */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              ⚠️ <strong>Важно:</strong> Все рекомендации носят информационный характер 
              и не заменяют консультацию врача. Перед началом приёма БАДов обязательно 
              проконсультируйтесь с медицинским специалистом.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Brain,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Star,
  Calendar
} from 'lucide-react';

// Интерфейсы для результатов
interface Recommendation {
  id: string;
  name: string;
  dosage: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  duration: string;
  confidence?: number;
}

interface FormResults {
  form: {
    id: string;
    createdAt: string;
    answers: any;
  };
  recommendations: Recommendation[];
  analysis?: {
    healthScore?: number;
    summary?: string;
  };
}

const ResultsPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<FormResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`${apiUrl}/forms/${formId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setResults(response.data.results);
      } else {
        throw new Error(response.data.message || 'Ошибка загрузки результатов');
      }
    } catch (error: any) {
      // console.error('Ошибка загрузки результатов:', error);
      if (error.response?.status === 401) {
        toast.error('Сессия истекла');
        navigate('/auth');
      } else {
        setError(error.response?.data?.message || 'Ошибка загрузки результатов');
      }
    } finally {
      setLoading(false);
    }
  }, [formId, apiUrl, token, navigate]);

  useEffect(() => {
    if (formId) {
      loadResults();
    }
  }, [formId, loadResults]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий приоритет';
      case 'medium': return 'Средний приоритет';
      case 'low': return 'Низкий приоритет';
      default: return 'Приоритет не определен';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <Star className="w-4 h-4 fill-current" />;
      case 'medium': return <Clock className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const handleBookConsultation = () => {
    navigate('/consultations');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Загружаем результаты анализа...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Ошибка загрузки</h3>
          <p className="text-gray-600">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button onClick={loadResults} className="btn-primary">
              Попробовать снова
            </button>
            <button onClick={() => navigate('/profile')} className="btn-secondary">
              Вернуться в профиль
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!results || results.recommendations.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <Brain size={32} className="text-yellow-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Анализ в процессе</h3>
          <p className="text-gray-600">Рекомендации ещё обрабатываются. Проверьте позже.</p>
          <button onClick={() => navigate('/profile')} className="btn-primary">
            Вернуться в профиль
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/profile')} 
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Назад</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
              <Brain className="text-primary-600" />
              <span>Результаты анализа</span>
            </h1>
            <p className="text-gray-600 mt-1">
              Анализ от {new Date(results.form.createdAt).toLocaleDateString('ru-RU')}
            </p>
          </div>
        </div>
        
        {/* Кнопка записи на консультацию */}
        <button 
          onClick={handleBookConsultation}
          className="btn-primary flex items-center space-x-2"
        >
          <Calendar size={20} />
          <span>Записаться на консультацию</span>
        </button>
      </div>

      {/* Общий анализ здоровья */}
      {results.analysis && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Общий анализ здоровья</h2>
          {results.analysis.healthScore && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-700">Оценка здоровья:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {results.analysis.healthScore}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${results.analysis.healthScore}%` }}
                />
              </div>
            </div>
          )}
          {results.analysis.summary && (
            <p className="text-gray-700 leading-relaxed">{results.analysis.summary}</p>
          )}
        </div>
      )}

      {/* Рекомендации */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Рекомендации</h2>
        <div className="space-y-6">
          {results.recommendations.map((recommendation, index) => (
            <div key={recommendation.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {recommendation.name}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <span>Дозировка:</span>
                      <span className="font-medium">{recommendation.dosage}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>Длительность:</span>
                      <span className="font-medium">{recommendation.duration}</span>
                    </span>
                    {recommendation.confidence && (
                      <span className="flex items-center space-x-1">
                        <span>Уверенность:</span>
                        <span className="font-medium">{recommendation.confidence}%</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getPriorityColor(recommendation.priority)}`}>
                  {getPriorityIcon(recommendation.priority)}
                  <span>{getPriorityText(recommendation.priority)}</span>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Обоснование рекомендации:</h4>
                <p className="text-gray-700 leading-relaxed">{recommendation.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Призыв к действию */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
            <Calendar size={32} className="text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">
            Получите персональную консультацию
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Для получения более детальных рекомендаций и составления персонального плана 
            запишитесь на консультацию с врачом-нутрициологом. Первая консультация всего за 1 рубль!
          </p>
          <button 
            onClick={handleBookConsultation}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Calendar size={20} />
            <span>Записаться на консультацию</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage; 
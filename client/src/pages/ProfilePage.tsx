import React, { useState, useEffect } from 'react';
import { User, Brain, FileText, Award, TrendingUp, Clock, RefreshCw, AlertCircle, Phone, Check, Send } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';

interface UserStats {
  analysesCount: number;
  formsCount: number;
  averageConfidence: number;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  createdAt: string;
}

interface Form {
  id: string;
  date: string;
  status: 'completed' | 'pending';
  confidence: number;
  recommendationsCount: number;
  recommendations: {
    name: string;
    dosage: string;
    priority: string;
  }[];
}

interface Analysis {
  id: string;
  date: string;
  status: string;
  confidence: number;
  recommendations: {
    name: string;
    dosage: string;
    priority: string;
  }[];
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  // Состояния для реальных данных
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    analysesCount: 0,
    formsCount: 0,
    averageConfidence: 0
  });
  const [forms, setForms] = useState<Form[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retryingAnalysis, setRetryingAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Состояния для телефона
  const [phoneInput, setPhoneInput] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [showSmsForm, setShowSmsForm] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [confirmingSms, setConfirmingSms] = useState(false);

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
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return 'Неизвестен';
    }
  };

  // Функции для загрузки данных
  const loadUserStats = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Необходимо войти в систему');
        return;
      }

      const response = await axios.get(`${apiUrl}/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUserStats({
          analysesCount: response.data.stats.analysesCount,
          formsCount: response.data.stats.formsCount,
          averageConfidence: response.data.stats.averageConfidence
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      setError('Не удалось загрузить статистику');
    }
  };

  const loadUserProfile = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Необходимо войти в систему');
        return;
      }

      const response = await axios.get(`${apiUrl}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUserProfile(response.data.user);
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      setError('Не удалось загрузить профиль');
    }
  };

  const loadAllForms = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Необходимо войти в систему');
        return;
      }

      const response = await axios.get(`${apiUrl}/users/all-forms`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setForms(response.data.forms);
      }
    } catch (error) {
      console.error('Ошибка загрузки всех форм:', error);
      setError('Не удалось загрузить формы');
    }
  };

  const loadUserAnalyses = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Необходимо войти в систему');
        return;
      }

      const response = await axios.get(`${apiUrl}/users/analyses`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAnalyses(response.data.analyses);
      }
    } catch (error) {
      console.error('Ошибка загрузки анализов:', error);
      setError('Не удалось загрузить анализы');
    }
  };

  // Функция для обновления данных
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      loadUserProfile(),
      loadUserStats(),
      loadAllForms(),
      loadUserAnalyses()
    ]);
    setRefreshing(false);
  };

  // Функция для повторной отправки анализа
  const retryAnalysis = async (formId: string) => {
    setRetryingAnalysis(formId);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Необходимо войти в систему');
        return;
      }

      const response = await axios.post(`${apiUrl}/forms/retry-analysis/${formId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success('Анализ успешно выполнен!');
        // Обновляем данные
        await refreshData();
      } else {
        toast.error(response.data.message || 'Ошибка при повторной отправке анализа');
      }
    } catch (error: any) {
      console.error('Ошибка повторной отправки:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Не удалось отправить анализ на обработку');
      }
    } finally {
      setRetryingAnalysis(null);
    }
  };

  // Функции для работы с телефоном
  const addPhone = async () => {
    if (!phoneInput.trim()) {
      toast.error('Введите номер телефона');
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Необходимо войти в систему');
        return;
      }

      const response = await axios.post(`${apiUrl}/users/phone`, {
        phone: phoneInput
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        await loadUserProfile(); // Обновляем профиль
        setShowPhoneForm(false);
        setPhoneInput('');
      } else {
        toast.error(response.data.message || 'Ошибка при добавлении телефона');
      }
    } catch (error: any) {
      console.error('Ошибка добавления телефона:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Не удалось добавить номер телефона');
      }
    }
  };

  const sendSmsCode = async () => {
    setSendingSms(true);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Необходимо войти в систему');
        return;
      }

      const response = await axios.post(`${apiUrl}/users/phone/verify`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowSmsForm(true);
        
        // В development режиме показываем код для тестирования
        if (response.data.developmentCode) {
          toast.success(`Код для тестирования: ${response.data.developmentCode}`, {
            duration: 10000
          });
        }
      } else {
        toast.error(response.data.message || 'Ошибка при отправке SMS');
      }
    } catch (error: any) {
      console.error('Ошибка отправки SMS:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Не удалось отправить SMS код');
      }
    } finally {
      setSendingSms(false);
    }
  };

  const confirmSmsCode = async () => {
    if (!smsCode.trim() || smsCode.length !== 6) {
      toast.error('Введите 6-значный SMS код');
      return;
    }

    setConfirmingSms(true);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Необходимо войти в систему');
        return;
      }

      const response = await axios.post(`${apiUrl}/users/phone/confirm`, {
        code: smsCode
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        await loadUserProfile(); // Обновляем профиль
        setShowSmsForm(false);
        setSmsCode('');
      } else {
        toast.error(response.data.message || 'Неверный SMS код');
      }
    } catch (error: any) {
      console.error('Ошибка подтверждения SMS:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Не удалось подтвердить SMS код');
      }
    } finally {
      setConfirmingSms(false);
    }
  };

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadUserProfile(),
        loadUserStats(),
        loadAllForms(),
        loadUserAnalyses()
      ]);
      setLoading(false);
    };

    if (user) {
      loadData();
    }
  }, [user]);

  // Автообновление каждые 30 секунд если есть pending анализы
  useEffect(() => {
    const hasPendingForms = forms.some(form => form.status === 'pending');
    
    if (hasPendingForms) {
      const interval = setInterval(() => {
        console.log('🔄 Проверяем обновления pending анализов...');
        refreshData();
      }, 30000); // 30 секунд

      return () => clearInterval(interval);
    }
  }, [forms]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Загружаем данные профиля...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="card text-center space-y-4">
          <h3 className="text-xl font-semibold text-gray-900">Ошибка</h3>
          <p className="text-gray-600">{error}</p>
          <button onClick={refreshData} className="btn-primary">
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const completedForms = forms.filter(form => form.status === 'completed');
  const pendingForms = forms.filter(form => form.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Заголовок с кнопкой обновления */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
          <p className="text-gray-600 mt-2">Ваша персональная панель здоровья</p>
        </div>
        <button 
          onClick={refreshData}
          disabled={refreshing}
          className="btn-secondary flex items-center space-x-2"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Обновляем...' : 'Обновить'}</span>
        </button>
      </div>

      {/* Статистика */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain size={24} className="text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{completedForms.length}</div>
          <div className="text-gray-600">Готовых анализов</div>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={24} className="text-blue-600" />
            </div>
          <div className="text-2xl font-bold text-gray-900">{forms.length}</div>
          <div className="text-gray-600">Всего анкет</div>
              </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {completedForms.length > 0 
              ? Math.round(completedForms.reduce((sum, form) => sum + form.confidence, 0) / completedForms.length)
              : 0}%
          </div>
          <div className="text-gray-600">Средняя уверенность</div>
            </div>
          </div>

      {/* Профиль пользователя */}
      {userProfile && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2 mb-6">
            <User size={24} className="text-primary-600" />
            <span>Информация профиля</span>
            </h3>
            
          <div className="grid md:grid-cols-2 gap-6">
            {/* Основная информация */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {userProfile.name || 'Не указано'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  {userProfile.email}
              </div>
              </div>
            </div>
            
            {/* Управление телефоном */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер телефона
                </label>
                
                {userProfile.phone ? (
                  <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Phone size={16} className="text-gray-500" />
                      <span>{userProfile.phone}</span>
                      {userProfile.phoneVerified && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Check size={16} />
                          <span className="text-sm">Подтвержден</span>
                        </div>
                      )}
                    </div>
                    
                    {!userProfile.phoneVerified && (
                      <button
                        onClick={sendSmsCode}
                        disabled={sendingSms}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
                      >
                        <Send size={14} />
                        <span>{sendingSms ? 'Отправляем...' : 'Подтвердить'}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {!showPhoneForm ? (
                      <button
                        onClick={() => setShowPhoneForm(true)}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Phone size={16} />
                        <span>Добавить номер телефона</span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="+79991234567"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={addPhone}
                            className="btn-primary flex-1"
                          >
                            Добавить
                          </button>
                          <button
                            onClick={() => {
                              setShowPhoneForm(false);
                              setPhoneInput('');
                            }}
                            className="btn-secondary"
                          >
                            Отмена
                          </button>
                  </div>
                </div>
              )}
                  </div>
                )}
              </div>
              
              {/* Форма подтверждения SMS */}
              {showSmsForm && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                  <div className="flex items-center space-x-2 text-blue-800">
                    <Send size={16} />
                    <span className="font-medium">Подтвердите номер телефона</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Введите 6-значный код, отправленный на ваш номер
                  </p>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={confirmSmsCode}
                        disabled={confirmingSms || smsCode.length !== 6}
                        className="btn-primary flex-1 disabled:opacity-50"
                      >
                        {confirmingSms ? 'Проверяем...' : 'Подтвердить'}
                      </button>
                      <button
                        onClick={() => {
                          setShowSmsForm(false);
                          setSmsCode('');
                        }}
                        className="btn-secondary"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pending анализы */}
      {pendingForms.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2 mb-4">
            <Clock size={24} className="text-yellow-600" />
            <span>Анализы в обработке</span>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm">
              {pendingForms.length}
            </span>
          </h3>
          
          <div className="space-y-3">
            {pendingForms.map((form, index) => (
              <div key={form.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Clock size={20} className="text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Анкета #{forms.length - forms.indexOf(form)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {new Date(form.date).toLocaleDateString('ru-RU')} в {new Date(form.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center space-x-3">
                    <div>
                      <div className="text-sm font-medium text-yellow-700">
                        Анализ в процессе...
                      </div>
                      <div className="text-xs text-yellow-600">
                        Результат появится автоматически
                      </div>
                    </div>
                    <button
                      onClick={() => retryAnalysis(form.id)}
                      disabled={retryingAnalysis === form.id}
                      className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm flex items-center space-x-1"
                    >
                      {retryingAnalysis === form.id ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Обработка...</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle size={14} />
                          <span>Повторить</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Brain size={14} className="text-blue-600" />
              </div>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Ваши анализы обрабатываются</p>
                <p>Страница автоматически обновляется каждые 30 секунд. Если анализ долго не готов, используйте кнопку "Повторить".</p>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Последний анализ */}
            <div className="card space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                  <Brain size={24} className="text-primary-600" />
                  <span>Последний анализ</span>
                </h3>

        {completedForms.length > 0 ? (
          <div className="space-y-4">
            <div className="p-6 border border-primary-200 bg-primary-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    Анализ #{forms.length - forms.findIndex(f => f.id === completedForms[0].id)}
                  </h4>
                  <p className="text-gray-600">
                    {new Date(completedForms[0].date).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {completedForms[0].confidence}%
                  </div>
                  <div className="text-sm text-gray-500">уверенности</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Рекомендации:</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {completedForms[0].recommendationsCount}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Статус:</div>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    Готово
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => window.location.href = `/results/${completedForms[0].id}`}
                  className="btn-primary flex-1"
                >
                  Посмотреть детали
                </button>
                <button className="btn-secondary">
                  Экспорт PDF
                </button>
              </div>
            </div>
          </div>
        ) : pendingForms.length > 0 ? (
          <div className="card text-center space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Clock size={32} className="text-yellow-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Анализ в процессе</h3>
            <p className="text-gray-600">
              Ваши анкеты обрабатываются. Результаты появятся автоматически.
            </p>
            </div>
          ) : (
            <div className="card text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <Brain size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Анализов пока нет</h3>
              <p className="text-gray-600">
                Заполните анкету, чтобы получить персональные рекомендации по здоровью
              </p>
            <button 
              onClick={() => window.location.href = '/survey'}
              className="btn-primary"
            >
                Заполнить первую анкету
              </button>
            </div>
          )}
      </div>

          {/* История анализов */}
          <div className="card space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
              <FileText size={24} className="text-primary-600" />
              <span>История анализов</span>
            </h3>

        {completedForms.length > 0 ? (
              <div className="space-y-3">
            {completedForms.map((form, index) => (
              <div key={form.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <Brain size={20} className="text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                        Анализ #{forms.length - forms.findIndex(f => f.id === form.id)}
                          </h4>
                          <p className="text-sm text-gray-500">
                        {new Date(form.date).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                      {form.confidence}% уверенности
                        </div>
                        <div className="text-xs text-gray-500">
                      {form.recommendationsCount} рекомендаций
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                  <button 
                    onClick={() => window.location.href = `/results/${form.id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                        Открыть
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 text-sm">
                        Скачать
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">История анализов пуста</p>
                <p className="text-gray-400 text-sm">Заполните анкету, чтобы получить первый анализ</p>
              </div>
            )}
          </div>

          {/* Призыв к действию */}
          <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Готовы к новому анализу?
              </h3>
              <p className="text-gray-600">
                Регулярные анализы помогают отслеживать изменения в вашем здоровье
                и корректировать рекомендации.
              </p>
          <button 
            onClick={() => window.location.href = '/survey'}
            className="btn-primary"
          >
                Заполнить новую анкету
              </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 
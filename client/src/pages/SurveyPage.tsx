import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, User, Heart, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const SurveyPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 3;

  // Состояние формы согласно чек-листу
  const [formData, setFormData] = useState({
    // ПУНКТ ПЕРВЫЙ - Персональная информация
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    email: '',
    birthDate: '',
    age: '',
    gender: '',
    maritalStatus: '',
    hasChildren: '',
    childrenAge: '',
    height: '',
    weight: '',
    weightYearAgo: '',

    // ПУНКТ ВТОРОЙ - Образ жизни
    country: '',
    city: '',
    activityLevel: '',
    workType: '',
    isStudent: false,
    wakeUpTime: '',
    sleepTime: '',
    sleepQuality: '',
    breakfast: '',
    mealsPerDay: '',
    mainMeal: '',
    mealIntervals: '',
    dinnerToSleep: '',
    emotionalState: [] as string[],
    stressLevel: '',
    alcoholSmoking: '',

    // ПУНКТ ТРЕТИЙ - Медицинская информация
    familyMedicalHistory: '',
    personalMedicalHistory: '',
    chronicDiseases: '',
    surgeries: '',
    lactoseReaction: '',
    caseinReaction: '',
    glutenReaction: '',
    drugReaction: '',
    vaccineReaction: '',
    foodAllergy: '',
    seasonalAllergy: '',
    
    // Системы организма
    nervousSystem: [] as string[],
    vision: [] as string[],
    entSystem: [] as string[],
    cardiovascular: [] as string[],
    gastrointestinal: [] as string[],
    genitourinary: [] as string[],
    skin: [] as string[],
    hair: [] as string[],
    nails: [] as string[],
    endocrine: [] as string[],
    musculoskeletal: [] as string[],
    
    // Женские вопросы
    regularCycle: '',
    pmsSymptoms: '',
    oralContraceptives: '',
    pregnancies: '',
    births: '',
    miscarriages: '',
    gynecologicalDiseases: [] as string[],
    menopauseSymptoms: [] as string[],
    
    // Лекарства и добавки
    medications: ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field as keyof typeof prev] as string[], value]
        : (prev[field as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // console.log('📝 Отправляем анкету:', formData);
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Необходимо войти в систему');
        navigate('/auth');
        return;
      }

      const response = await axios.post(`${apiUrl}/forms/submit`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      });

      // console.log('✅ Ответ сервера:', response.data);

      if (response.data.success) {
        toast.success('Анкета успешно отправлена!');
        navigate('/consultations');
      } else {
        toast.error(response.data.message || 'Ошибка при отправке анкеты');
      }
    } catch (error: any) {
      // console.error('💥 Ошибка отправки анкеты:', error);
      toast.error(error.response?.data?.message || 'Ошибка при отправке анкеты');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <User size={48} className="mx-auto text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Персональная информация</h2>
              <p className="text-gray-600">Расскажите о себе</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фамилия *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Отчество
                </label>
                <input
                  type="text"
                  value={formData.middleName}
                  onChange={(e) => handleInputChange('middleName', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Номер телефона *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="input-field"
                  placeholder="+7 (999) 123-45-67"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата рождения *
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пол *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Выберите пол</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Семейное положение
                </label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                  className="input-field"
                >
                  <option value="">Выберите статус</option>
                  <option value="married">Женат/Замужем</option>
                  <option value="single">Холост/Не замужем</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Есть ли дети?
                </label>
                <select
                  value={formData.hasChildren}
                  onChange={(e) => handleInputChange('hasChildren', e.target.value)}
                  className="input-field"
                >
                  <option value="">Выберите ответ</option>
                  <option value="yes">Да</option>
                  <option value="no">Нет</option>
                </select>
              </div>

              {formData.hasChildren === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Возраст детей
                  </label>
                  <input
                    type="text"
                    value={formData.childrenAge}
                    onChange={(e) => handleInputChange('childrenAge', e.target.value)}
                    className="input-field"
                    placeholder="Например: 5, 12 лет"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Рост (см) *
                </label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="input-field"
                  placeholder="170"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Вес (кг) *
                </label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="input-field"
                  placeholder="70"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Вес год назад (кг)
                </label>
                <input
                  type="number"
                  value={formData.weightYearAgo}
                  onChange={(e) => handleInputChange('weightYearAgo', e.target.value)}
                  className="input-field"
                  placeholder="75"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Activity size={48} className="mx-auto text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Образ жизни</h2>
              <p className="text-gray-600">Расскажите о своем образе жизни</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Страна проживания
                </label>
                      <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className="input-field"
                  placeholder="Россия"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Город проживания
                    </label>
                      <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="input-field"
                  placeholder="Москва"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Образ жизни и уровень активности *
                </label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Выберите уровень активности</option>
                  <option value="high">Высокая активность (физический спорт от 3-х раз в неделю)</option>
                  <option value="medium">Средняя активность (бытовая активность, работа по дому)</option>
                  <option value="low">Низкая активность (сидячий, малоподвижный образ жизни)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Характер работы *
                </label>
                <select
                  value={formData.workType}
                  onChange={(e) => handleInputChange('workType', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">Выберите тип работы</option>
                  <option value="office">Офисная, сидячая работа</option>
                  <option value="physical">Физическая работа, ручная</option>
                  <option value="heavy">Работа, связанная с подъёмами тяжести</option>
                  <option value="student">Учёба</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Время подъёма
                </label>
                <input
                  type="time"
                  value={formData.wakeUpTime}
                  onChange={(e) => handleInputChange('wakeUpTime', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Время отбоя
                </label>
                <input
                  type="time"
                  value={formData.sleepTime}
                  onChange={(e) => handleInputChange('sleepTime', e.target.value)}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Качество сна
                </label>
                <select
                  value={formData.sleepQuality}
                  onChange={(e) => handleInputChange('sleepQuality', e.target.value)}
                  className="input-field"
                >
                  <option value="">Выберите качество сна</option>
                  <option value="good">Хорошее, не просыпаюсь ночью</option>
                  <option value="bad">Плохо засыпаю и трудно просыпаюсь утром</option>
                  <option value="frequent">Часто просыпаюсь с позывами в туалет</option>
                  <option value="superficial">Сон поверхностный, тревожный</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Завтрак (с 6 до 10 утра)
                </label>
                <select
                  value={formData.breakfast}
                  onChange={(e) => handleInputChange('breakfast', e.target.value)}
                  className="input-field"
                >
                  <option value="">Выберите ответ</option>
                  <option value="always">ЕСТЬ</option>
                  <option value="never">НЕТ</option>
                  <option value="sometimes">НЕ ВСЕГДА</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Сколько раз в день вы едите, включая перекусы?
                </label>
                <input
                  type="number"
                  value={formData.mealsPerDay}
                  onChange={(e) => handleInputChange('mealsPerDay', e.target.value)}
                  className="input-field"
                  placeholder="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Большее количество пищи вы съедаете в
                </label>
                <select
                  value={formData.mainMeal}
                  onChange={(e) => handleInputChange('mainMeal', e.target.value)}
                  className="input-field"
                >
                  <option value="">Выберите основной прием пищи</option>
                  <option value="breakfast">ЗАВТРАК</option>
                  <option value="lunch">ОБЕД</option>
                  <option value="dinner">УЖИН</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Интервалы между приёмами пищи могут достигать (часов)
                </label>
                <input
                  type="number"
                  value={formData.mealIntervals}
                  onChange={(e) => handleInputChange('mealIntervals', e.target.value)}
                  className="input-field"
                  placeholder="4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Время между окончанием ужина и отходом ко сну (часов)
                </label>
                <input
                  type="number"
                  value={formData.dinnerToSleep}
                  onChange={(e) => handleInputChange('dinnerToSleep', e.target.value)}
                  className="input-field"
                  placeholder="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Уровень стресса
                </label>
                <select
                  value={formData.stressLevel}
                  onChange={(e) => handleInputChange('stressLevel', e.target.value)}
                  className="input-field"
                >
                  <option value="">Выберите уровень стресса</option>
                  <option value="low">Низкий</option>
                  <option value="moderate">Умеренный</option>
                  <option value="medium">Средний</option>
                  <option value="high">Выше среднего</option>
                  <option value="very_high">Высокий</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Отношение к алкоголю и табакокурению
                </label>
                <select
                  value={formData.alcoholSmoking}
                  onChange={(e) => handleInputChange('alcoholSmoking', e.target.value)}
                  className="input-field"
                >
                  <option value="">Выберите отношение</option>
                  <option value="abuse">Злоупотребляю</option>
                  <option value="moderate">Употребляю умеренно</option>
                  <option value="occasional">Употребляю по случаю</option>
                  <option value="smoking">Курю (вейп, сигареты, кальян)</option>
                  <option value="none">Не употребляю спиртных напитков и не курю</option>
                </select>
              </div>
            </div>

            {/* Эмоциональное состояние */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Общее эмоциональное состояние (выберите все подходящие варианты)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Меня всё устраивает',
                  'Частая смена настроения и всплески эмоций',
                  'Частая агрессия, тревожность без причин',
                  'Депрессия',
                  'Панические атаки',
                  'Повышенная возбудимость (постоянная, приходящая)',
                  'Физические и умственные действия требуют энергии (нарушение концентрации внимания и памяти)',
                  'Недостаток энергии или чувство усталости',
                  'Чувство одиночества'
                ].map((option) => (
                  <label key={option} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formData.emotionalState.includes(option)}
                      onChange={(e) => handleArrayChange('emotionalState', option, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Heart size={48} className="mx-auto text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Медицинская информация</h2>
              <p className="text-gray-600">Расскажите о своем здоровье</p>
            </div>

            <div className="space-y-6">
              {/* Медицинская история семьи */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Медицинская история семьи (кровные родственники)
                </label>
                <textarea
                  value={formData.familyMedicalHistory}
                  onChange={(e) => handleInputChange('familyMedicalHistory', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Есть ли у родственников заболевания ЖКТ, сердечно-сосудистые, эндокринные заболевания, онкология и т.п."
                />
              </div>

              {/* Медицинская история */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Медицинская история: состояния, заболевания и травмы
                </label>
                <textarea
                  value={formData.personalMedicalHistory}
                  onChange={(e) => handleInputChange('personalMedicalHistory', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Перечислите состояния, заболевания и травмы, которые отмечались у вас когда-либо в прошлом"
                />
              </div>

              {/* Хронические заболевания */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Хронические заболевания
                </label>
                <textarea
                  value={formData.chronicDiseases}
                  onChange={(e) => handleInputChange('chronicDiseases', e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Какие хронические заболевания у вас есть?"
                />
              </div>

              {/* Операции */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Операции или малоинвазивные хирургические вмешательства
                </label>
                <textarea
                  value={formData.surgeries}
                  onChange={(e) => handleInputChange('surgeries', e.target.value)}
                  className="input-field"
                  rows={2}
                  placeholder="Какие операции были у вас?"
                />
              </div>

              {/* Аллергии */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Реакция на лактозу
                  </label>
                  <select
                    value={formData.lactoseReaction}
                    onChange={(e) => handleInputChange('lactoseReaction', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Выберите ответ</option>
                    <option value="yes">Есть реакция</option>
                    <option value="no">Нет реакции</option>
                    <option value="unknown">Не знаю</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Реакция на казеин
                  </label>
                  <select
                    value={formData.caseinReaction}
                    onChange={(e) => handleInputChange('caseinReaction', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Выберите ответ</option>
                    <option value="yes">Есть реакция</option>
                    <option value="no">Нет реакции</option>
                    <option value="unknown">Не знаю</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Реакция на глютен
                  </label>
                  <select
                    value={formData.glutenReaction}
                    onChange={(e) => handleInputChange('glutenReaction', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Выберите ответ</option>
                    <option value="yes">Есть реакция</option>
                    <option value="no">Нет реакции</option>
                    <option value="unknown">Не знаю</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Реакция на лекарственные препараты
                  </label>
                  <select
                    value={formData.drugReaction}
                    onChange={(e) => handleInputChange('drugReaction', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Выберите ответ</option>
                    <option value="yes">Есть реакция</option>
                    <option value="no">Нет реакции</option>
                    <option value="unknown">Не знаю</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Реакция на вакцины
                  </label>
                  <select
                    value={formData.vaccineReaction}
                    onChange={(e) => handleInputChange('vaccineReaction', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Выберите ответ</option>
                    <option value="yes">Есть реакция</option>
                    <option value="no">Нет реакции</option>
                    <option value="unknown">Не знаю</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Пищевая аллергия
                  </label>
                      <input
                    type="text"
                    value={formData.foodAllergy}
                    onChange={(e) => handleInputChange('foodAllergy', e.target.value)}
                    className="input-field"
                    placeholder="На что аллергия?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Сезонная аллергия
                    </label>
                  <input
                    type="text"
                    value={formData.seasonalAllergy}
                    onChange={(e) => handleInputChange('seasonalAllergy', e.target.value)}
                    className="input-field"
                    placeholder="На что аллергия?"
                  />
                </div>
              </div>

              {/* Женские вопросы */}
              {formData.gender === 'female' && (
                <div className="bg-pink-50 p-4 rounded-lg space-y-4">
                  <h3 className="font-semibold text-gray-900">Женские вопросы</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Регулярный менструальный цикл
                      </label>
                      <select
                        value={formData.regularCycle}
                        onChange={(e) => handleInputChange('regularCycle', e.target.value)}
                        className="input-field"
                      >
                        <option value="">Выберите ответ</option>
                        <option value="yes">ДА</option>
                        <option value="no">НЕТ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Симптомы ПМС
                      </label>
                      <input
                        type="text"
                        value={formData.pmsSymptoms}
                        onChange={(e) => handleInputChange('pmsSymptoms', e.target.value)}
                        className="input-field"
                        placeholder="Какие симптомы?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Принимаете оральные контрацептивы
                      </label>
                <select
                        value={formData.oralContraceptives}
                        onChange={(e) => handleInputChange('oralContraceptives', e.target.value)}
                  className="input-field"
                      >
                        <option value="">Выберите ответ</option>
                        <option value="yes">ДА</option>
                        <option value="no">НЕТ</option>
                </select>
              </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Количество беременностей
                      </label>
                      <input
                        type="number"
                        value={formData.pregnancies}
                        onChange={(e) => handleInputChange('pregnancies', e.target.value)}
                        className="input-field"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Количество родов
                      </label>
                      <input
                        type="number"
                        value={formData.births}
                        onChange={(e) => handleInputChange('births', e.target.value)}
                        className="input-field"
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Количество выкидышей
                      </label>
                      <input
                        type="number"
                        value={formData.miscarriages}
                        onChange={(e) => handleInputChange('miscarriages', e.target.value)}
                        className="input-field"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Лекарства и добавки */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Лекарства и пищевые добавки, витамины, которые принимали или принимаете
                </label>
                <textarea
                  value={formData.medications}
                  onChange={(e) => handleInputChange('medications', e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Перечислите все лекарства, добавки и витамины"
                />
              </div>

              {/* Загрузка анализов */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Прикрепите любые анализы, полученные за последние 2-3 месяца
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      // Обработка загрузки файлов
                      const files = e.target.files;
                      if (files) {
                        // console.log('Загружено файлов:', files.length);
                        // Здесь можно добавить логику загрузки файлов
                      }
                    }}
                    className="hidden"
                    id="analyses-upload"
                  />
                  <label htmlFor="analyses-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <FileText size={24} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Нажмите для загрузки файлов
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, JPG, PNG, DOC до 10 МБ каждый
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  * Анализы помогут врачу составить более точные рекомендации
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Прогресс */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Медицинская анкета</h1>
          <div className="text-sm text-gray-500">
            Шаг {currentStep} из {totalSteps}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Контент шага */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        {renderStepContent()}
      </div>

      {/* Навигация */}
      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={20} />
          <span>Назад</span>
        </button>

        {currentStep < totalSteps ? (
          <button
            onClick={nextStep}
            className="btn-primary flex items-center space-x-2"
          >
            <span>Далее</span>
            <ChevronRight size={20} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Отправляем...</span>
              </>
            ) : (
              <>
                <FileText size={20} />
                <span>Отправить анкету</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default SurveyPage; 
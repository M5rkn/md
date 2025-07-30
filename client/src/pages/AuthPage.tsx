import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../hooks/useAuth';
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Heart, 
  Activity,
  Shield,
  ArrowRight,
  CheckCircle,
  Phone
} from 'lucide-react';

// Схемы валидации
const loginSchema = yup.object({
  email: yup.string().email('Неверный формат email').required('Email обязателен'),
  password: yup.string().min(6, 'Минимум 6 символов').required('Пароль обязателен'),
});

const registerSchema = yup.object({
  name: yup.string().required('Имя обязательно'),
  email: yup.string().email('Неверный формат email').required('Email обязателен'),
  password: yup.string().min(6, 'Минимум 6 символов').required('Пароль обязателен'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Пароли должны совпадать')
    .required('Подтвердите пароль'),
  phone: yup.string()
    .test('phone-format', 'Номер должен быть российским в формате +79991234567', function(value) {
      if (!value) return true; // Пустое значение разрешено
      return /^\+7[9]\d{9}$/.test(value);
    })
    .optional()
});

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const navigate = useNavigate();
  const { login, register, user, loading } = useAuth();

  // Контролируем первоначальную загрузку страницы
  useEffect(() => {
    // Сначала показываем контент без анимаций
    setShowContent(true);
    
    // Затем включаем анимации через небольшую задержку
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const loginForm = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange'
  });

  const registerForm = useForm({
    resolver: yupResolver(registerSchema),
    mode: 'onChange'
  });

  const currentForm = isLogin ? loginForm : registerForm;

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await login(data.email, data.password);
      } else {
        await register({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
        });
      }
    } catch (error) {
      // Ошибки обрабатываются в useAuth
    } finally {
      setIsLoading(false);
    }
  };

  // Отслеживаем изменения пользователя для перенаправления
  useEffect(() => {
    if (user && !loading) {
      navigate('/profile');
    }
  }, [user, loading, navigate]);

  // Создаем явный обработчик формы
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Получаем данные из формы вручную
    const formData = currentForm.getValues();
    
    // Проверяем валидацию
    const isValid = await currentForm.trigger();
    if (!isValid) {
      return false;
    }
    
    // Вызываем нашу функцию
    await onSubmit(formData);
    return false;
  };

  const handleModeSwitch = (newMode: boolean) => {
    setIsLogin(newMode);
    // Сбрасываем формы при переключении
    loginForm.reset();
    registerForm.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const FloatingIcon = ({ icon: Icon, delay = 0 }: { icon: any, delay?: number }) => (
    <div 
      className={`absolute opacity-10 text-medical-600 ${!isInitialLoad ? 'animate-pulse' : ''}`}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: '3s'
      }}
    >
      <Icon size={24} />
    </div>
  );

  // Если контент еще не готов к показу, показываем пустой div
  if (!showContent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-medical-100 flex items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-r from-medical-500 to-medical-600 rounded-2xl flex items-center justify-center">
          <Heart className="w-8 h-8 text-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-medical-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Фоновые медицинские иконки */}
      <FloatingIcon icon={Heart} delay={0} />
      <FloatingIcon icon={Activity} delay={1} />
      <FloatingIcon icon={Shield} delay={2} />
      
      {/* Анимированные частицы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-medical-200 rounded-full opacity-30 ${!isInitialLoad ? 'animate-bounce' : ''}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className={`w-full max-w-md transition-all duration-700 ease-out ${!isInitialLoad ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
        {/* Логотип и заголовок */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-medical-500 to-medical-600 rounded-2xl mb-4 shadow-lg transform transition-all duration-500 ${!isInitialLoad ? 'scale-100' : 'scale-95'} hover:scale-105`}>
            <Heart className={`w-8 h-8 text-white ${!isInitialLoad ? 'animate-pulse' : ''}`} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 transition-all duration-500 ease-in-out">
            {isLogin ? 'Добро пожаловать!' : 'Присоединяйтесь к нам!'}
          </h1>
          <p className="text-gray-600 transition-all duration-500 ease-in-out">
            {isLogin 
              ? 'Войдите в свой аккаунт для персонализированного анализа здоровья'
              : 'Создайте аккаунт и получите индивидуальные рекомендации по здоровью'
            }
          </p>
        </div>

        {/* Переключатель режима */}
        <div className={`flex bg-gray-100 rounded-xl p-2 mb-8 relative overflow-hidden transition-all duration-500 ${!isInitialLoad ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'}`}>
          <div 
            className={`absolute top-2 bottom-2 bg-white rounded-lg shadow-md transition-all duration-300 ease-out ${
              isLogin 
                ? 'left-2 right-1/2 mr-1' 
                : 'left-1/2 right-2 ml-1'
            }`}
          />
          <button
            type="button"
            onClick={() => handleModeSwitch(true)}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors duration-300 relative z-10 rounded-lg ${
              isLogin ? 'text-medical-600' : 'text-gray-500'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch(false)}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors duration-300 relative z-10 rounded-lg ${
              !isLogin ? 'text-medical-600' : 'text-gray-500'
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Форма */}
        <div className={`bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm border border-gray-100 transition-all duration-600 ${!isInitialLoad ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-6'}`}>
          <form 
            onSubmit={handleFormSubmit}
            className="space-y-6"
          >
            {/* Поле имени для регистрации */}
            <div 
              className={`transition-all duration-500 ease-in-out ${
                !isLogin 
                  ? 'opacity-100 max-h-32 transform translate-y-0' 
                  : 'opacity-0 max-h-0 transform -translate-y-4 overflow-hidden'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Полное имя
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400 group-focus-within:text-medical-500 transition-colors" />
                </div>
                <input
                  {...registerForm.register('name')}
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white"
                  placeholder="Введите ваше имя"
                />
              </div>
              {registerForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600 animate-shake">
                  {String(registerForm.formState.errors.name.message)}
                </p>
              )}
            </div>

            {/* Телефон (только для регистрации) */}
            <div 
              className={`transition-all duration-700 ${
                !isLogin 
                  ? 'opacity-100 max-h-32 transform translate-y-0' 
                  : 'opacity-0 max-h-0 transform -translate-y-4 overflow-hidden'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Номер телефона (необязательно)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-medical-500 transition-colors" />
                </div>
                <input
                  {...registerForm.register('phone')}
                  type="tel"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white"
                  placeholder="+79991234567"
                />
                {registerForm.watch('phone') && !registerForm.formState.errors.phone && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 animate-scale-in" />
                  </div>
                )}
              </div>
              {registerForm.formState.errors.phone && (
                <p className="mt-1 text-sm text-red-600 animate-shake">
                  {String(registerForm.formState.errors.phone.message)}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Только российские номера. Можно добавить и подтвердить позже в профиле
              </p>
            </div>

            {/* Email */}
            <div className={`transition-all duration-300 ${!isInitialLoad ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-4'}`} style={{ transitionDelay: !isInitialLoad ? '200ms' : '0ms' }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email адрес
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-medical-500 transition-colors" />
                </div>
                <input
                  {...currentForm.register('email')}
                  type="email"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white ${
                    currentForm.formState.errors.email 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="example@email.com"
                />
                {currentForm.watch('email') && !currentForm.formState.errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 animate-scale-in" />
                  </div>
                )}
              </div>
              {currentForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600 animate-shake flex items-center">
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {String(currentForm.formState.errors.email?.message)}
                </p>
              )}
            </div>

            {/* Пароль */}
            <div className={`transition-all duration-300 ${!isInitialLoad ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-4'}`} style={{ transitionDelay: !isInitialLoad ? '300ms' : '0ms' }}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-medical-500 transition-colors" />
                </div>
                <input
                  {...currentForm.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white ${
                    currentForm.formState.errors.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-300' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Введите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-medical-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {currentForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600 animate-shake flex items-center">
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {String(currentForm.formState.errors.password?.message)}
                </p>
              )}
            </div>

            {/* Подтверждение пароля для регистрации */}
            <div 
              className={`transition-all duration-500 ease-in-out ${
                !isLogin 
                  ? 'opacity-100 max-h-32 transform translate-y-0' 
                  : 'opacity-0 max-h-0 transform -translate-y-4 overflow-hidden'
              }`}
            >
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Подтвердите пароль
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-medical-500 transition-colors" />
                </div>
                <input
                  {...registerForm.register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-medical-500 focus:border-transparent transition-all duration-300 bg-gray-50 focus:bg-white"
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-medical-500 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {registerForm.formState.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 animate-shake flex items-center">
                  <span className="inline-block w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                  {String(registerForm.formState.errors.confirmPassword.message)}
                </p>
              )}
            </div>

            {/* Кнопка отправки */}
            <button
              type="button"
              disabled={isLoading || !currentForm.formState.isValid}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFormSubmit(e as any);
              }}
              className={`w-full bg-gradient-to-r from-medical-500 to-medical-600 hover:from-medical-600 hover:to-medical-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none group ${!isInitialLoad ? 'opacity-100 translate-y-0' : 'opacity-0 transform translate-y-4'}`}
              style={{ transitionDelay: !isInitialLoad ? '400ms' : '0ms' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Обработка...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  {isLogin ? 'Войти в аккаунт' : 'Создать аккаунт'}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Дополнительная информация */}
        <div className={`mt-8 text-center transition-all duration-500 ${!isInitialLoad ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`} style={{ transitionDelay: !isInitialLoad ? '500ms' : '0ms' }}>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
            <Shield className="h-4 w-4 text-medical-500" />
            <span>Ваши данные защищены и конфиденциальны</span>
          </div>
          
          {isLogin && (
            <button
              type="button"
              className="text-medical-600 hover:text-medical-700 text-sm font-medium transition-colors"
            >
              Забыли пароль?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage; 
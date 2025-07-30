import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Shield, 
  Users, 
  CheckCircle,
  ArrowRight,
  Heart,
  Activity,
  Calendar,
  Clock,
  Phone
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-16">
      {/* Hero секция */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Персональные{' '}
            <span className="text-primary-600">консультации</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Запишитесь на консультацию с врачом-нутрициологом. Первая консультация всего за 1 рубль!
          </p>
        </div>

        {/* CTA кнопки */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {user ? (
            <>
              <Link 
                to="/survey" 
                className="btn-primary flex items-center space-x-2 text-lg px-8 py-3"
              >
                <FileText size={20} />
                <span>Заполнить анкету</span>
                <ArrowRight size={16} />
              </Link>
              <Link 
                to="/consultations" 
                className="btn-secondary flex items-center space-x-2 text-lg px-8 py-3"
              >
                <Calendar size={20} />
                <span>Записаться на консультацию</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                to="/auth" 
                className="btn-primary flex items-center space-x-2 text-lg px-8 py-3"
              >
                <Heart size={20} />
                <span>Начать сейчас</span>
                <ArrowRight size={16} />
              </Link>
              <button 
                className="btn-secondary text-lg px-8 py-3"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Узнать больше
              </button>
            </>
          )}
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">1000+</div>
            <div className="text-gray-600">Проведенных консультаций</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">95%</div>
            <div className="text-gray-600">Довольных клиентов</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">24/7</div>
            <div className="text-gray-600">Запись на консультации</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">1₽</div>
            <div className="text-gray-600">Первая консультация</div>
          </div>
        </div>
      </section>

      {/* Возможности */}
      <section id="features" className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Как проходит консультация
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Простой и эффективный процесс получения персональных рекомендаций от врача
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Анкета */}
          <div className="card text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <FileText size={32} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              1. Заполните анкету
            </h3>
            <p className="text-gray-600">
              Подробная медицинская анкета поможет врачу понять ваше состояние здоровья, 
              образ жизни и цели.
            </p>
          </div>

          {/* Запись */}
          <div className="card text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Calendar size={32} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              2. Запишитесь на консультацию
            </h3>
            <p className="text-gray-600">
              Выберите удобное время для консультации с врачом-нутрициологом. 
              Первая консультация всего за 1 рубль!
            </p>
          </div>

          {/* Консультация */}
          <div className="card text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <Phone size={32} className="text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              3. Получите рекомендации
            </h3>
            <p className="text-gray-600">
              Врач проведет консультацию и даст персональные рекомендации 
              по питанию и образу жизни.
            </p>
          </div>
        </div>
      </section>

      {/* Преимущества */}
      <section className="bg-white rounded-2xl p-8 md:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Почему выбирают нас?
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle size={24} className="text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Опытные врачи</h3>
                  <p className="text-gray-600">
                    Консультации проводят квалифицированные врачи-нутрициологи 
                    с многолетним опытом работы.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle size={24} className="text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Удобное время</h3>
                  <p className="text-gray-600">
                    Гибкое расписание консультаций. Записывайтесь в любое удобное время, 
                    включая выходные.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle size={24} className="text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-900">Персональный подход</h3>
                  <p className="text-gray-600">
                    Каждая консультация учитывает ваши индивидуальные особенности, 
                    состояние здоровья и цели.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="card text-center p-6">
                <Shield size={32} className="text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Конфиденциальность</h3>
                <p className="text-sm text-gray-600">Ваши данные под защитой</p>
              </div>
              <div className="card text-center p-6">
                <Users size={32} className="text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Онлайн консультации</h3>
                <p className="text-sm text-gray-600">Не выходя из дома</p>
              </div>
            </div>
            <div className="space-y-4 pt-8">
              <div className="card text-center p-6">
                <Clock size={32} className="text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Экономия времени</h3>
                <p className="text-sm text-gray-600">Без очередей и ожидания</p>
              </div>
              <div className="card text-center p-6">
                <Activity size={32} className="text-primary-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Результаты</h3>
                <p className="text-sm text-gray-600">Измеримый прогресс</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA секция */}
      {!user && (
        <section className="bg-primary-600 text-white rounded-2xl p-8 md:p-12 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Готовы начать заботиться о своём здоровье?
            </h2>
            <p className="text-lg text-primary-100 max-w-2xl mx-auto">
              Запишитесь на первую консультацию за 1 рубль и получите персональные 
              рекомендации от опытного врача-нутрициолога.
            </p>
            <Link 
              to="/auth" 
              className="inline-flex items-center space-x-2 bg-white text-primary-600 font-semibold px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors"
            >
              <span>Записаться за 1₽</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage; 
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Phone, 
  CheckCircle, 
  Download
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  price: number;
  isFirstConsultation: boolean;
}

interface DaySchedule {
  date: string;
  dayName: string;
  slots: TimeSlot[];
}

const ConsultationsPage: React.FC = () => {
  // // const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка расписания с сервера
  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Необходимо войти в систему');
        return;
      }

      const response = await axios.get(`${apiUrl}/consultations/schedule`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setSchedule(response.data.schedule);
      } else {
        toast.error('Ошибка загрузки расписания');
      }
    } catch (error: any) {
      // // console.error('Ошибка загрузки расписания:', error);
      toast.error(error.response?.data?.message || 'Ошибка загрузки расписания');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setIsBooking(true);
    
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Необходимо войти в систему');
        return;
      }

      const response = await axios.post(`${apiUrl}/consultations/book`, {
        date: selectedDate,
        time: selectedTime
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setBookingSuccess(true);
        toast.success('Запись на консультацию успешно создана!');
        
        // Обновляем расписание
        await loadSchedule();
        
        // Сброс выбора
        setTimeout(() => {
          setSelectedDate('');
          setSelectedTime('');
          setBookingSuccess(false);
        }, 3000);
      } else {
        toast.error(response.data.message || 'Ошибка записи на консультацию');
      }
    } catch (error: any) {
      // // console.error('Ошибка записи:', error);
      toast.error(error.response?.data?.message || 'Ошибка записи на консультацию');
    } finally {
      setIsBooking(false);
    }
  };

  const addToCalendar = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`);
    const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // +1 час
    
    // Формат для iOS календаря
    const calendarUrl = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${eventDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      'SUMMARY:Консультация с врачом-нутрициологом',
      'DESCRIPTION:Персональная консультация по питанию и здоровью',
      'LOCATION:Онлайн консультация',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
    
    // Создаем файл для скачивания
    const blob = new Blob([calendarUrl], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `consultation-${date}-${time}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Событие добавлено в календарь!');
  };

  const selectedSlot = schedule
    .find(day => day.date === selectedDate)
    ?.slots.find(slot => slot.time === selectedTime);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-lg text-gray-600">Загрузка расписания...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Расписание консультаций
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Выберите удобное время для консультации с врачом-нутрициологом. 
          Первая консультация всего за 1 рубль!
        </p>
      </div>

      {/* Информация о ценах */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Первая консультация</h3>
              <p className="text-2xl font-bold text-green-600">1 ₽</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <Phone size={24} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Последующие консультации</h3>
              <p className="text-2xl font-bold text-primary-600">1500 ₽</p>
            </div>
          </div>
        </div>
      </div>

      {/* Расписание */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Календарь */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Выберите дату</h2>
          <div className="grid grid-cols-2 gap-4">
            {schedule.map((day) => (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDate === day.date
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-sm font-medium text-gray-500">
                  {day.dayName}
                </div>
                <div className="text-lg font-semibold">
                  {new Date(day.date).getDate()}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(day.date).toLocaleDateString('ru-RU', { month: 'short' })}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Временные слоты */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Выберите время</h2>
          {selectedDate ? (
            <div className="space-y-4">
              {schedule
                .find(day => day.date === selectedDate)
                ?.slots.map((slot) => (
                  <button
                    key={slot.id}
                    onClick={() => handleTimeSelect(selectedDate, slot.time)}
                    disabled={!slot.available}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      selectedTime === slot.time
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : slot.available
                        ? 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                        : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Clock size={20} />
                        <span className="font-semibold">{slot.time}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {slot.price} ₽
                        </div>
                        {slot.isFirstConsultation && (
                          <div className="text-xs text-green-600 font-medium">
                            Первая консультация
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
              <p>Выберите дату для просмотра доступного времени</p>
            </div>
          )}
        </div>
      </div>

      {/* Выбранная консультация */}
      {selectedSlot && (
        <div className="bg-white rounded-2xl p-6 border-2 border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Выбранная консультация
            </h3>
            <div className="text-2xl font-bold text-primary-600">
              {selectedSlot.price} ₽
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-3">
              <Calendar size={20} className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Дата</div>
                <div className="font-semibold">
                  {new Date(selectedDate).toLocaleDateString('ru-RU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock size={20} className="text-gray-500" />
              <div>
                <div className="text-sm text-gray-500">Время</div>
                <div className="font-semibold">{selectedTime}</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleBooking}
              disabled={isBooking}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              {isBooking ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Записываем...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  <span>Записаться на консультацию</span>
                </>
              )}
            </button>
            
            <button
              onClick={() => addToCalendar(selectedDate, selectedTime)}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <Download size={20} />
              <span>Добавить в календарь</span>
            </button>
          </div>
        </div>
      )}

      {/* Успешная запись */}
      {bookingSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Запись успешно создана!
            </h3>
            <p className="text-gray-600 mb-6">
              Мы отправили подтверждение на ваш email. 
              За 15 минут до консультации вы получите ссылку для подключения.
            </p>
            <button
              onClick={() => setBookingSuccess(false)}
              className="btn-primary w-full"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {/* Информация о консультации */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Что включено в консультацию?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Анализ анкеты</h4>
              <p className="text-sm text-gray-600">
                Врач изучит вашу медицинскую анкету перед консультацией
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Персональные рекомендации</h4>
              <p className="text-sm text-gray-600">
                Получите индивидуальный план питания и образа жизни
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Ответы на вопросы</h4>
              <p className="text-sm text-gray-600">
                Задайте любые вопросы о здоровье и питании
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle size={20} className="text-green-500 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900">Письменное заключение</h4>
              <p className="text-sm text-gray-600">
                Получите подробное заключение с рекомендациями
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationsPage; 
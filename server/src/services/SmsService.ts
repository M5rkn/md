import axios from 'axios';
import * as crypto from 'crypto';

interface SmsResponse {
  status: string;
  status_code: number;
  sms?: {
    [key: string]: {
      status: string;
      status_code: number;
      sms_id: string;
    };
  };
  balance?: number;
  error?: string;
}

export class SmsService {
  private apiId: string;
  private from: string;
  private enabled: boolean;
  private baseUrl = 'https://sms.ru/sms/send';

  constructor() {
    this.apiId = process.env.SMS_RU_API_ID || '';
    this.from = process.env.SMS_RU_FROM || 'RABOTAA';
    this.enabled = process.env.SMS_ENABLE === 'true';
    
    if (this.enabled && !this.apiId) {
      console.warn('⚠️ SMS.ru API ID не настроен, SMS отправка отключена');
      this.enabled = false;
    }
  }

  /**
   * Генерирует 6-значный SMS код
   */
  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Создает хэш кода для безопасного хранения
   */
  hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  /**
   * Проверяет код против хэша
   */
  verifyCode(code: string, hash: string): boolean {
    const codeHash = this.hashCode(code);
    return codeHash === hash;
  }

  /**
   * Форматирует номер телефона для SMS.ru API
   */
  private formatPhone(phone: string): string {
    // Убираем + и оставляем только цифры
    return phone.replace(/\D/g, '');
  }

  /**
   * Отправляет SMS через SMS.ru API
   */
  async sendSms(phone: string, code: string): Promise<{ success: boolean; message: string; smsId?: string }> {
    if (!this.enabled) {
      console.log('📱 SMS отправка отключена, код для разработки:', code);
      return {
        success: true,
        message: 'SMS отправлен (режим разработки)',
        smsId: 'dev_' + Date.now()
      };
    }

    try {
      const formattedPhone = this.formatPhone(phone);
      const message = `Код подтверждения RABOTAA: ${code}. Не сообщайте код третьим лицам.`;

      console.log('📱 Отправляем SMS на номер:', phone);
      console.log('📝 Текст сообщения:', message);

      const response = await axios.post<SmsResponse>(this.baseUrl, null, {
        params: {
          api_id: this.apiId,
          to: formattedPhone,
          msg: message,
          from: this.from,
          json: 1
        },
        timeout: 10000
      });

      console.log('📨 Ответ SMS.ru:', response.data);

      if (response.data.status === 'OK') {
        const smsData = response.data.sms?.[formattedPhone];
        if (smsData && smsData.status === 'OK') {
          return {
            success: true,
            message: 'SMS успешно отправлен',
            smsId: smsData.sms_id
          };
        } else {
          return {
            success: false,
            message: `Ошибка отправки SMS: ${smsData?.status || 'Неизвестная ошибка'}`
          };
        }
      } else {
        return {
          success: false,
          message: response.data.error || 'Ошибка SMS сервиса'
        };
      }

    } catch (error: any) {
      console.error('❌ Ошибка отправки SMS:', error);
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'SMS сервис временно недоступен'
        };
      }
      
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.error || 'Ошибка SMS API'
        };
      }

      return {
        success: false,
        message: 'Не удалось отправить SMS'
      };
    }
  }

  /**
   * Проверяет доступность SMS сервиса
   */
  async checkBalance(): Promise<{ success: boolean; balance?: number; message: string }> {
    if (!this.enabled) {
      return {
        success: true,
        message: 'SMS сервис отключен (режим разработки)'
      };
    }

    try {
      const response = await axios.get('https://sms.ru/my/balance', {
        params: {
          api_id: this.apiId,
          json: 1
        },
        timeout: 5000
      });

      if (response.data.status === 'OK') {
        return {
          success: true,
          balance: response.data.balance,
          message: `Баланс: ${response.data.balance} руб.`
        };
      } else {
        return {
          success: false,
          message: response.data.error || 'Ошибка проверки баланса'
        };
      }

    } catch (error: any) {
      console.error('❌ Ошибка проверки баланса SMS:', error);
      return {
        success: false,
        message: 'Не удалось проверить баланс SMS сервиса'
      };
    }
  }

  /**
   * Возвращает информацию о настройках SMS
   */
  getSettings() {
    return {
      enabled: this.enabled,
      provider: 'SMS.ru',
      from: this.from,
      hasApiKey: !!this.apiId
    };
  }
}

export const smsService = new SmsService(); 
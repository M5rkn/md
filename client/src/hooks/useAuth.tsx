import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  role: 'ADMIN' | 'DOCTOR' | 'USER';
  createdAt: string;
  updatedAt: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Настройка axios
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';



const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Добавляем токен к запросам
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Обработка ошибок авторизации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Только для 401 ошибок авторизации очищаем токены
    // Остальные ошибки (429, 404 и т.д.) обрабатываются в компонентах
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Используем React Router navigation вместо window.location
      // window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (savedToken && savedUser) {
          // Проверяем валидность токена
          const response = await api.get('/auth/me');
          setUser(response.data.user);
          setToken(savedToken);
        }
      } catch (error) {
        // Токен невалиден, очищаем данные
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { user: userData, token } = response.data;
      
      // Сохраняем данные
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setToken(token);
      
      toast.success(`Добро пожаловать, ${userData.name}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка входа';
      
      if (error.response?.status === 401) {
        toast.error('Неверный email или пароль');
      } else if (error.response?.status === 404) {
        toast.error('Пользователь не найден. Зарегистрируйтесь сначала.');
      } else if (error.response?.status === 429) {
        toast.error('Слишком много попыток входа. Подождите немного и попробуйте снова.');
      } else if (error.response?.data?.message) {
        // Показываем точное сообщение от сервера
        toast.error(error.response.data.message);
      } else {
        toast.error(message);
      }
      
      // Не выбрасываем ошибку, так как уже показали уведомление
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      
      const response = await api.post('/auth/register', data);
      const { user: userData, token } = response.data;
      
      // Сохраняем данные
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setToken(token);
      
      toast.success(`Регистрация успешна! Добро пожаловать, ${userData.name}!`);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Ошибка регистрации';
      
      if (error.response?.status === 409) {
        // Показываем конкретное сообщение об ошибке уникальности
        toast.error(error.response.data.message || 'Пользователь с такими данными уже существует');
      } else if (error.response?.status === 429) {
        toast.error('Слишком много попыток регистрации. Подождите немного и попробуйте снова.');
      } else if (error.response?.data?.errors) {
        // Показываем ошибки валидации
        const errors = error.response.data.errors;
        errors.forEach((err: any) => {
          toast.error(err.message);
        });
      } else if (error.response?.data?.message) {
        // Показываем точное сообщение от сервера
        toast.error(error.response.data.message);
      } else {
        toast.error(message);
      }
      
      // Не выбрасываем ошибку, так как уже показали уведомление
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    toast.success('Вы успешно вышли из системы');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 
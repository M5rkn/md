import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut, FileText, BarChart3, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">МА</span>
            </div>
            <Link 
              to="/" 
              className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors"
            >
              Медицинский агрегатор
            </Link>
          </div>

          {/* Навигация для авторизованных пользователей */}
          {user && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <BarChart3 size={20} />
                <span>Главная</span>
              </Link>
              <Link 
                to="/survey" 
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <FileText size={20} />
                <span>Анкета</span>
              </Link>
              <Link 
                to="/consultations" 
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <Calendar size={20} />
                <span>Консультации</span>
              </Link>
              <Link 
                to="/profile" 
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
              >
                <User size={20} />
                <span>Профиль</span>
              </Link>
            </nav>
          )}

          {/* Действия пользователя */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-primary-600" />
                  </div>
                  <span className="text-sm text-gray-700 hidden sm:block">
                    {user.name || 'Пользователь'}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-500 hover:text-red-600 transition-colors"
                  title="Выйти"
                >
                  <LogOut size={20} />
                  <span className="hidden sm:block">Выйти</span>
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                className="btn-primary"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 
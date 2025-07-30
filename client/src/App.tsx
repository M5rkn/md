import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import SurveyPage from './pages/SurveyPage';
import ResultsPage from './pages/ResultsPage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/AuthPage';
import ConsultationsPage from './pages/ConsultationsPage';

// Контекст для управления аутентификацией пользователя
import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Публичные страницы */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* Защищённые страницы */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/survey" element={<SurveyPage />} />
            <Route path="/consultations" element={<ConsultationsPage />} />
            <Route path="/results/:formId" element={<ResultsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          
          {/* 404 страница */}
          <Route path="*" element={<div>Страница не найдена</div>} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App; 
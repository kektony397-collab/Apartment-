import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { initDB, verifyAdmin } from './services/db';
import type { Language } from './types';
import { translations } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('en');

  const checkAuth = useCallback(async () => {
    try {
      await initDB();
      const sessionAuth = sessionStorage.getItem('isAuthenticated');
      if (sessionAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  
  const handleLogin = async (password: string): Promise<boolean> => {
    const success = await verifyAdmin(password);
    if (success) {
      setIsAuthenticated(true);
      sessionStorage.setItem('isAuthenticated', 'true');
    }
    return success;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('isAuthenticated');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">{(translations[language].loading as string)}...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} language={language} setLanguage={setLanguage} />
      ) : (
        <Dashboard onLogout={handleLogout} language={language} setLanguage={setLanguage} />
      )}
    </div>
  );
};

export default App;

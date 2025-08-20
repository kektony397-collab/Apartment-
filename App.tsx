
import React, { useState, useEffect, useCallback } from 'react';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import { initDB, getAuthStatus } from './services/db';
import type { Language } from './types';
import { translations } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSetup, setIsSetup] = useState<boolean>(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'pin' | null>(null);
  const [username, setUsername] = useState<string | undefined>(undefined);
  const [language, setLanguage] = useState<Language>('en');

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      await initDB();
      const authStatus = await getAuthStatus();
      setIsSetup(authStatus.isSetup);
      if (authStatus.isSetup) {
        setAuthMethod(authStatus.authMethod!);
        setUsername(authStatus.username);
      } else {
        setAuthMethod(null);
        setUsername(undefined);
      }
      
      const sessionAuth = sessionStorage.getItem('isAuthenticated');
      if (sessionAuth === 'true' && authStatus.isSetup) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
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
  
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('isAuthenticated', 'true');
    // If login was result of initial setup, re-run checkAuth to update state
    checkAuth();
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
        <LoginPage 
            onLoginSuccess={handleLoginSuccess} 
            language={language} 
            setLanguage={setLanguage} 
            isInitialSetup={!isSetup}
            existingAuthMethod={authMethod}
            existingUsername={username}
        />
      ) : (
        <Dashboard onLogout={handleLogout} language={language} setLanguage={setLanguage} />
      )}
    </div>
  );
};

export default App;

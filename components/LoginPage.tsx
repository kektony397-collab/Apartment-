import React, { useState } from 'react';
import type { Language } from '../types';
import { translations } from '../constants';

interface LoginPageProps {
  onLogin: (password: string) => Promise<boolean>;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, language, setLanguage }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await onLogin(password);
    if (!success) {
      setError(t.invalidCredentials as string);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'gu' : 'en');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <h2 className={`text-3xl font-bold text-center text-gray-900 ${language === 'gu' ? 'font-gujarati' : ''}`}>
            {t.loginTitle as string}
          </h2>
          <button
            onClick={toggleLanguage}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {(language === 'en' ? t.toggleToGujarati : t.toggleToEnglish) as string}
          </button>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">{t.username as string}</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-none appearance-none rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t.username as string}
                defaultValue="admin"
                readOnly
              />
            </div>
            <div>
              <label htmlFor="password-login" className="sr-only">{t.password as string}</label>
              <input
                id="password-login"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-none appearance-none rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder={t.password as string}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${language === 'gu' ? 'font-gujarati' : ''}`}
            >
              {t.login as string}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

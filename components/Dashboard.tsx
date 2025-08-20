import React, { useState } from 'react';
import ReceiptsManager from './ReceiptsManager';
import ExpenseCalculator from './ExpenseCalculator';
import ProfileSettings from './ProfileSettings';
import type { Language } from '../types';
import { translations } from '../constants';

interface DashboardProps {
  onLogout: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

type Tab = 'receipts' | 'expenses' | 'profile';

const Dashboard: React.FC<DashboardProps> = ({ onLogout, language, setLanguage }) => {
  const [activeTab, setActiveTab] = useState<Tab>('receipts');
  const t = translations[language];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'gu' : 'en');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'receipts':
        return <ReceiptsManager language={language} />;
      case 'expenses':
        return <ExpenseCalculator language={language} />;
      case 'profile':
        return <ProfileSettings language={language} />;
      default:
        return null;
    }
  };

  const getTabClass = (tabName: Tab) => {
      const baseClass = `px-4 py-2 font-medium rounded-t-lg transition-colors duration-200 ${language === 'gu' ? 'font-gujarati' : ''}`;
      return activeTab === tabName
        ? `${baseClass} bg-white text-indigo-600`
        : `${baseClass} text-gray-500 hover:text-indigo-600 hover:bg-gray-50`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="container px-4 py-4 mx-auto sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className={`text-2xl font-bold text-gray-900 ${language === 'gu' ? 'font-gujarati' : ''}`}>
              {t.appName as string}
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLanguage}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {(language === 'en' ? t.toggleToGujarati : t.toggleToEnglish) as string}
              </button>
              <button
                onClick={onLogout}
                className={`px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${language === 'gu' ? 'font-gujarati' : ''}`}
              >
                {t.logout as string}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container p-4 mx-auto sm:px-6 lg:px-8">
         <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-6" aria-label="Tabs">
              <button onClick={() => setActiveTab('receipts')} className={getTabClass('receipts')}>
                {t.receipts as string}
              </button>
              <button onClick={() => setActiveTab('expenses')} className={getTabClass('expenses')}>
                {t.expenses as string}
              </button>
              <button onClick={() => setActiveTab('profile')} className={getTabClass('profile')}>
                {t.profileSettings as string}
              </button>
            </nav>
        </div>
        
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

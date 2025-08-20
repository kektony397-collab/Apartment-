
import React, { useState, useEffect } from 'react';
import type { Language } from '../types';
import { translations } from '../constants';
import { setupAdmin, verifyPassword, verifyPin } from '../services/db';
import PinPad from './PinPad';

interface LoginPageProps {
  onLoginSuccess: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isInitialSetup: boolean;
  existingAuthMethod: 'password' | 'pin' | null;
  existingUsername?: string;
}

type View = 'initial' | 'select_method' | 'setup_password' | 'setup_pin' | 'login_password' | 'login_pin';

const LoginPage: React.FC<LoginPageProps> = (props) => {
  const { onLoginSuccess, language, setLanguage, isInitialSetup, existingAuthMethod, existingUsername } = props;
  
  const [view, setView] = useState<View>('initial');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [pinReset, setPinReset] = useState(false);
  
  const t = translations[language];

  useEffect(() => {
    setError('');
    if (isInitialSetup) {
      setView('select_method');
    } else if (existingAuthMethod === 'password') {
      setView('login_password');
      setUsername(existingUsername || '');
    } else if (existingAuthMethod === 'pin') {
      setView('login_pin');
    }
  }, [isInitialSetup, existingAuthMethod, existingUsername]);

  const toggleLanguage = () => setLanguage(language === 'en' ? 'gu' : 'en');
  
  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch as string);
      return;
    }
    if (!username || !password) return;
    await setupAdmin({ authMethod: 'password', username, password });
    onLoginSuccess();
  };
  
  const handlePinSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if(pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError(t.pinsDoNotMatch as string);
      return;
    }
    await setupAdmin({ authMethod: 'pin', pin });
    onLoginSuccess();
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await verifyPassword(username, password);
    if (success) {
      onLoginSuccess();
    } else {
      setError(t.invalidCredentials as string);
    }
  };

  const handlePinLogin = async (submittedPin: string) => {
      setError('');
      setPinReset(false);
      const success = await verifyPin(submittedPin);
      if (success) {
          onLoginSuccess();
      } else {
          setError(t.incorrectPin as string);
          setPinReset(true); // Signal PinPad to reset
      }
  };

  const renderHeader = (title: string) => (
    <div className="flex items-center justify-between">
      <h2 className={`text-2xl font-bold text-center text-gray-900 ${language === 'gu' ? 'font-gujarati' : ''}`}>
        {title}
      </h2>
      <button onClick={toggleLanguage} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        {(language === 'en' ? t.toggleToGujarati : t.toggleToEnglish) as string}
      </button>
    </div>
  );
  
  const renderContent = () => {
    switch(view) {
      case 'select_method':
        return (
          <>
            {renderHeader(t.setupTitle as string)}
            <div className="mt-8 space-y-4 text-center">
                <p className={`text-gray-600 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.setupMethodPrompt as string}</p>
                <button onClick={() => setView('setup_password')} className={`w-full px-4 py-3 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.setupWithPassword as string}</button>
                <button onClick={() => setView('setup_pin')} className={`w-full px-4 py-3 font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.setupWithPin as string}</button>
            </div>
          </>
        );
      case 'setup_password':
        return (
          <>
            {renderHeader(t.setupWithPassword as string)}
            <form className="mt-8 space-y-6" onSubmit={handlePasswordSetup}>
              <input type="text" placeholder={t.usernamePlaceholder as string} value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <input type="password" placeholder={t.passwordPlaceholder as string} value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              <input type="password" placeholder={t.confirmPassword as string} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              {error && <p className="text-sm text-center text-red-600">{error}</p>}
              <button type="submit" className={`w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.createAccount as string}</button>
              <button onClick={() => setView('select_method')} className={`w-full mt-2 text-sm text-center text-gray-600 hover:text-indigo-500 ${language === 'gu' ? 'font-gujarati' : ''}`}>Back</button>
            </form>
          </>
        );
      case 'setup_pin':
        return (
            <>
              {renderHeader(t.setupWithPin as string)}
              <form className="mt-8 space-y-6" onSubmit={handlePinSetup}>
                <input type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder={t.pinPlaceholder as string} value={pin} onChange={e => setPin(e.target.value)} required className="w-full px-3 py-2 text-center tracking-[1rem] border border-gray-300 rounded-md" />
                <input type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder={t.confirmPin as string} value={confirmPin} onChange={e => setConfirmPin(e.target.value)} required className="w-full px-3 py-2 text-center tracking-[1rem] border border-gray-300 rounded-md" />
                {error && <p className="text-sm text-center text-red-600">{error}</p>}
                <button type="submit" className={`w-full px-4 py-2 font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.setPin as string}</button>
                 <button onClick={() => setView('select_method')} className={`w-full mt-2 text-sm text-center text-gray-600 hover:text-indigo-500 ${language === 'gu' ? 'font-gujarati' : ''}`}>Back</button>
              </form>
            </>
        );
      case 'login_password':
        return (
            <>
              {renderHeader(t.loginTitle as string)}
              <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
                <input type="text" value={username} readOnly className="w-full px-3 py-2 text-gray-500 bg-gray-100 border border-gray-300 rounded-md" />
                <input type="password" placeholder={t.password as string} value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                {error && <p className="text-sm text-center text-red-600">{error}</p>}
                <button type="submit" className={`w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.login as string}</button>
              </form>
            </>
        );
      case 'login_pin':
          return (
            <>
              {renderHeader(t.pinLoginTitle as string)}
              <div className="mt-8">
                  <PinPad onPinSubmit={handlePinLogin} title="" reset={pinReset} />
                  {error && <p className="mt-4 text-sm text-center text-red-600">{error}</p>}
              </div>
            </>
          );
      default:
        return null;
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        {renderContent()}
      </div>
    </div>
  );
};

export default LoginPage;

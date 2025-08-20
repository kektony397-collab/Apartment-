
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Language, Admin } from '../types';
import { translations } from '../constants';
import { getAdmin, updateAdmin, updatePassword, updatePin } from '../services/db';

// This is a global from the CDN script
declare const SignatureCanvas: any;

const ProfileSettings: React.FC<{ language: Language }> = ({ language }) => {
    const t = translations[language];
    const [admin, setAdmin] = useState<Partial<Admin>>({});
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const sigCanvas = useRef<any>({});

    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmNewPin, setConfirmNewPin] = useState('');
    const [securityMessage, setSecurityMessage] = useState({type: '', text: ''});


    const fetchAdmin = useCallback(async () => {
        const adminData = await getAdmin();
        if (adminData) {
            setAdmin(adminData);
            setSignatureData(adminData.signature || null);
             if (adminData.signature && sigCanvas.current.fromDataURL) {
                sigCanvas.current.fromDataURL(adminData.signature);
            }
        }
    }, []);

    useEffect(() => {
        fetchAdmin();
    }, [fetchAdmin]);

    const handleProfileSave = async () => {
        let signature = signatureData;
        if(sigCanvas.current && !sigCanvas.current.isEmpty()){
            signature = sigCanvas.current.toDataURL('image/png');
        }

        const profileData: Partial<Admin> = {
            name: admin.name || '',
            blockNumber: admin.blockNumber || '',
            signature: signature || '',
        };
        await updateAdmin(profileData);
        setSignatureData(signature);
        alert(t.profileUpdated as string);
    };
    
    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setSecurityMessage({type:'', text:''});
        if (newPassword !== confirmNewPassword) {
            setSecurityMessage({type: 'error', text: t.passwordsDoNotMatch as string});
            return;
        }
        await updatePassword(newPassword);
        setNewPassword('');
        setConfirmNewPassword('');
        setSecurityMessage({type: 'success', text: t.passwordUpdated as string});
    }
    
    const handlePinChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setSecurityMessage({type:'', text:''});
        if(newPin.length !== 4) {
             setSecurityMessage({type: 'error', text: 'PIN must be 4 digits'});
             return;
        }
        if (newPin !== confirmNewPin) {
            setSecurityMessage({type: 'error', text: t.pinsDoNotMatch as string});
            return;
        }
        await updatePin(newPin);
        setNewPin('');
        setConfirmNewPin('');
        setSecurityMessage({type: 'success', text: t.pinUpdated as string});
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setSignatureData(result);
                if (sigCanvas.current.fromDataURL) {
                   sigCanvas.current.fromDataURL(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const clearSignature = () => {
        if(sigCanvas.current.clear) sigCanvas.current.clear();
        setSignatureData(null);
    };

    return (
        <div className="space-y-6">
            <h2 className={`text-2xl font-bold text-gray-800 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.profileSettings as string}</h2>
            
            {/* Profile Section */}
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h3 className={`text-xl font-semibold mb-4 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.adminProfile as string}</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className={`block text-sm font-medium text-gray-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.adminName as string}</label>
                        <input type="text" value={admin.name || ''} onChange={e => setAdmin({...admin, name: e.target.value})} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div>
                        <label className={`block text-sm font-medium text-gray-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.blockNumber as string}</label>
                        <input type="text" value={admin.blockNumber || ''} onChange={e => setAdmin({...admin, blockNumber: e.target.value})} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    </div>
                    <div className="md:col-span-2">
                        <label className={`block text-sm font-medium text-gray-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.signature as string}</label>
                        <div className="mt-1 border border-gray-300 rounded-md">
                           {typeof SignatureCanvas !== 'undefined' ? (
                                <SignatureCanvas 
                                    ref={sigCanvas}
                                    canvasProps={{ className: 'w-full h-48' }}
                                />
                            ) : <p>Loading Signature Pad...</p>}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <button onClick={clearSignature} className={`px-4 py-2 text-sm font-medium text-white bg-gray-500 rounded-md hover:bg-gray-600 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.clear as string}</button>
                             <label className={`px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 cursor-pointer ${language === 'gu' ? 'font-gujarati' : ''}`}>
                                {t.uploadSignature as string}
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={handleProfileSave} className={`px-6 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.saveProfile as string}</button>
                </div>
            </div>

            {/* Security Section */}
            <div className="p-6 bg-white rounded-lg shadow-md">
                 <h3 className={`text-xl font-semibold mb-4 ${language === 'gu' ? 'font-gujarati' : ''}`}>{language === 'en' ? 'Security' : 'સુરક્ષા'}</h3>
                {admin.authMethod === 'password' && (
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <h4 className={`text-lg font-medium ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.changePassword as string}</h4>
                        <input type="password" placeholder={t.newPassword as string} value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                        <input type="password" placeholder={t.confirmNewPassword as string} value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                        <button type="submit" className={`px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.changePassword as string}</button>
                    </form>
                )}
                 {admin.authMethod === 'pin' && (
                    <form onSubmit={handlePinChange} className="space-y-4">
                        <h4 className={`text-lg font-medium ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.changePin as string}</h4>
                        <input type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder={t.newPin as string} value={newPin} onChange={e => setNewPin(e.target.value)} required className="w-full px-3 py-2 text-center tracking-[1rem] border border-gray-300 rounded-md"/>
                        <input type="password" inputMode="numeric" pattern="\d{4}" maxLength={4} placeholder={t.confirmNewPin as string} value={confirmNewPin} onChange={e => setConfirmNewPin(e.target.value)} required className="w-full px-3 py-2 text-center tracking-[1rem] border border-gray-300 rounded-md"/>
                        <button type="submit" className={`px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.changePin as string}</button>
                    </form>
                )}
                {securityMessage.text && (
                    <p className={`mt-4 text-sm ${securityMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{securityMessage.text}</p>
                )}
            </div>
        </div>
    );
};

export default ProfileSettings;

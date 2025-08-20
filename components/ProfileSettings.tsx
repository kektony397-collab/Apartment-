
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Language, Admin } from '../types';
import { translations } from '../constants';
import { getAdmin, updateAdmin } from '../services/db';

// This is a global from the CDN script
declare const SignatureCanvas: any;

const ProfileSettings: React.FC<{ language: Language }> = ({ language }) => {
    const t = translations[language];
    const [admin, setAdmin] = useState<Partial<Admin>>({});
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const sigCanvas = useRef<any>({});

    const fetchAdmin = useCallback(async () => {
        const adminData = await getAdmin();
        if (adminData) {
            setAdmin(adminData);
            setSignatureData(adminData.signature || null);
        }
    }, []);

    useEffect(() => {
        fetchAdmin();
    }, [fetchAdmin]);

    const handleSave = async () => {
        const signature = sigCanvas.current.isEmpty() ? signatureData : sigCanvas.current.toDataURL('image/png');
        const updatedAdmin: Admin = {
            ...admin,
            name: admin.name || '',
            blockNumber: admin.blockNumber || '',
            signature: signature || '',
            username: admin.username!, // These are guaranteed to exist
            passwordHash: admin.passwordHash!
        };
        await updateAdmin(updatedAdmin);
        setSignatureData(signature);
        alert(t.profileUpdated as string);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setSignatureData(result);
                sigCanvas.current.fromDataURL(result);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const clearSignature = () => {
        sigCanvas.current.clear();
        setSignatureData(null);
    };

    return (
        <div className="space-y-6">
            <h2 className={`text-2xl font-bold text-gray-800 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.adminProfile as string}</h2>
            <div className="p-6 bg-white rounded-lg shadow-md">
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
                         {signatureData && !sigCanvas.current?.isEmpty?.() && (
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">Current Saved Signature:</p>
                                <img src={signatureData} alt="signature" className="h-20 border" />
                            </div>
                         )}
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
                    <button onClick={handleSave} className={`px-6 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.saveProfile as string}</button>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;

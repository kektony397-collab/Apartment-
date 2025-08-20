import React, { useState, useEffect, useCallback } from 'react';
import type { Language, Receipt } from '../types';
import { translations } from '../constants';
import { addReceipt, getReceipts } from '../services/db';
import { generateReceiptPDF, exportAllReceiptsPDF, exportAllReceiptsExcel } from '../services/exportService';

const ReceiptForm: React.FC<{ language: Language, onReceiptCreated: () => void }> = ({ language, onReceiptCreated }) => {
    const t = translations[language];
    const [name, setName] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [amount, setAmount] = useState('');
    const [maintenancePeriod, setMaintenancePeriod] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!name || !date || !amount) return;
        setIsSubmitting(true);
        
        const createdReceipt = await addReceipt({
            name,
            date,
            amount: parseFloat(amount),
            maintenancePeriod,
        });
        
        setName('');
        setAmount('');
        setDate(new Date().toISOString().split('T')[0]);
        setMaintenancePeriod('');
        
        alert(t.receiptCreated as string);
        onReceiptCreated();
        setIsSubmitting(false);

        await generateReceiptPDF(createdReceipt, language);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className={`text-xl font-semibold mb-4 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.newReceipt as string}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-5">
                <input type="text" placeholder={t.recipientName as string} value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                <input type="month" value={maintenancePeriod} onChange={e => setMaintenancePeriod(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" title={t.maintenancePeriod as string} />
                <input type="number" placeholder={t.amount as string} value={amount} onChange={e => setAmount(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                <button type="submit" disabled={isSubmitting} className={`w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.createReceipt as string}</button>
            </form>
        </div>
    );
};


const ReceiptsManager: React.FC<{ language: Language }> = ({ language }) => {
    const t = translations[language];
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchReceipts = useCallback(async () => {
        const allReceipts = await getReceipts();
        setReceipts(allReceipts.reverse());
    }, []);

    useEffect(() => {
        fetchReceipts();
    }, [fetchReceipts]);

    const filteredReceipts = receipts.filter(r => 
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.date.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <h2 className={`text-2xl font-bold text-gray-800 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.receiptManagement as string}</h2>
            
            <ReceiptForm language={language} onReceiptCreated={fetchReceipts} />

            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="flex flex-col gap-4 mb-4 md:flex-row md:justify-between md:items-center">
                    <input type="text" placeholder={t.searchReceipts as string} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm md:w-1/3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
                    <div className="flex gap-2">
                        <button onClick={() => exportAllReceiptsPDF(receipts, language)} className={`px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.exportAllPDF as string}</button>
                        <button onClick={() => exportAllReceiptsExcel(receipts, language)} className={`px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.exportAllExcel as string}</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className={`p-4 text-xs font-semibold tracking-wider text-gray-500 uppercase ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.receiptNumber as string}</th>
                                <th className={`p-4 text-xs font-semibold tracking-wider text-gray-500 uppercase ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.recipientName as string}</th>
                                <th className={`p-4 text-xs font-semibold tracking-wider text-gray-500 uppercase ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.date as string}</th>
                                <th className={`p-4 text-xs font-semibold tracking-wider text-gray-500 uppercase ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.maintenancePeriod as string}</th>
                                <th className={`p-4 text-xs font-semibold tracking-wider text-gray-500 uppercase ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.amount as string}</th>
                                <th className={`p-4 text-xs font-semibold tracking-wider text-gray-500 uppercase ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.actions as string}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredReceipts.length > 0 ? filteredReceipts.map(receipt => (
                                <tr key={receipt.id}>
                                    <td className="p-4 text-sm text-gray-900 whitespace-nowrap">{receipt.receiptNumber}</td>
                                    <td className="p-4 text-sm text-gray-900 whitespace-nowrap">{receipt.name}</td>
                                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{receipt.date}</td>
                                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{receipt.maintenancePeriod}</td>
                                    <td className="p-4 text-sm font-medium text-gray-900 whitespace-nowrap">{receipt.amount.toFixed(2)}</td>
                                    <td className="p-4 text-sm whitespace-nowrap">
                                        <button onClick={() => generateReceiptPDF(receipt, language)} className={`text-indigo-600 hover:text-indigo-900 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.viewPDF as string}</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="p-4 text-center text-gray-500">{t.noReceipts as string}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReceiptsManager;
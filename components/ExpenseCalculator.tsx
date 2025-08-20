import React, { useState } from 'react';
import type { Language, ExpenseItem } from '../types';
import { translations } from '../constants';
import { generateExpensePDF } from '../services/exportService';
import { addExpenseReport } from '../services/db';

const ExpenseCalculator: React.FC<{ language: Language }> = ({ language }) => {
    const t = translations[language];
    const [items, setItems] = useState<ExpenseItem[]>([]);
    const [itemName, setItemName] = useState('');
    const [itemAmount, setItemAmount] = useState('');
    const [operation, setOperation] = useState<'add' | 'subtract'>('add');

    const total = items.reduce((acc, item) => acc + item.amount, 0);

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!itemName || !itemAmount) return;

        const amount = parseFloat(itemAmount) * (operation === 'add' ? 1 : -1);
        setItems([...items, { name: itemName, amount }]);
        setItemName('');
        setItemAmount('');
    };

    const handleSaveReport = async () => {
        if (items.length === 0) return;

        await addExpenseReport({
            date: new Date().toISOString().split('T')[0],
            items,
            total,
        });

        alert(t.reportSaved as string);
        setItems([]);
    }

    return (
        <div className="space-y-6">
            <h2 className={`text-2xl font-bold text-gray-800 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.expenseCalculator as string}</h2>

            <div className="p-6 bg-white rounded-lg shadow-md">
                <form onSubmit={handleAddItem} className="grid grid-cols-1 gap-4 md:grid-cols-5 md:items-end">
                    <div className="md:col-span-2">
                        <label className={`block text-sm font-medium text-gray-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.itemName as string}</label>
                        <input type="text" value={itemName} onChange={e => setItemName(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium text-gray-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.amount as string}</label>
                        <input type="number" value={itemAmount} onChange={e => setItemAmount(e.target.value)} required className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium text-gray-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.operation as string}</label>
                        <select value={operation} onChange={e => setOperation(e.target.value as 'add' | 'subtract')} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="add">{t.addition as string}</option>
                            <option value="subtract">{t.subtraction as string}</option>
                        </select>
                    </div>
                    <button type="submit" className={`w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.addItem as string}</button>
                </form>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="flex flex-col items-stretch gap-4 mb-4 md:flex-row md:justify-between md:items-center">
                    <h3 className="text-xl font-semibold">{language === 'en' ? 'Current Report Items' : 'વર્તમાન રિપોર્ટ વસ્તુઓ'}</h3>
                    <div className="flex gap-2">
                         <button onClick={handleSaveReport} disabled={items.length === 0} className={`px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-blue-300 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.saveReport as string}</button>
                        <button onClick={() => generateExpensePDF(items, total, language)} disabled={items.length === 0} className={`px-4 py-2 font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-green-300 ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.exportPDF as string}</button>
                    </div>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left bg-white">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className={`p-4 text-xs font-semibold tracking-wider text-gray-500 uppercase ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.itemName as string}</th>
                                <th className={`p-4 text-xs font-semibold tracking-wider text-gray-500 uppercase text-right ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.amount as string}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {items.map((item, index) => (
                                <tr key={index}>
                                    <td className="p-4 text-sm text-gray-900">{item.name}</td>
                                    <td className={`p-4 text-sm font-medium text-right ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{item.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="border-t-2 border-gray-300">
                             <tr>
                                <td className={`p-4 text-lg font-bold text-gray-900 uppercase ${language === 'gu' ? 'font-gujarati' : ''}`}>{t.grandTotal as string}</td>
                                <td className="p-4 text-lg font-bold text-right text-gray-900">{total.toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default ExpenseCalculator;
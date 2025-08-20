import React, { useState, useEffect, useCallback } from 'react';
import type { Language } from '../types';
import { translations } from '../constants';
import { getReceipts, getExpenseReports } from '../services/db';
import { DATA_CHANGED_EVENT } from '../lib/events';


interface DashboardViewProps {
    language: Language;
}

const StatCard: React.FC<{ title: string; value: string; color: string; language: Language }> = ({ title, value, color, language }) => (
    <div className={`p-6 bg-white rounded-lg shadow-md border-l-4 ${color}`}>
        <h3 className={`text-lg font-semibold text-gray-600 ${language === 'gu' || language === 'hi' ? 'font-gujarati' : ''}`}>{title}</h3>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
);

const DashboardView: React.FC<DashboardViewProps> = ({ language }) => {
    const t = translations[language];
    const [totalReceipts, setTotalReceipts] = useState(0);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const receipts = await getReceipts();
        const expenses = await getExpenseReports();

        const receiptsSum = receipts.reduce((sum, r) => sum + r.amount, 0);
        const expensesSum = expenses.reduce((sum, e) => sum + e.total, 0);

        setTotalReceipts(receiptsSum);
        setTotalExpenses(expensesSum);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
        
        const handleDataChange = () => fetchData();
        window.addEventListener(DATA_CHANGED_EVENT, handleDataChange);
        
        return () => {
            window.removeEventListener(DATA_CHANGED_EVENT, handleDataChange);
        };
    }, [fetchData]);
    
    const netBalance = totalReceipts - totalExpenses;
    
    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    if (isLoading) {
        return <div className="text-center text-gray-500">{(t.loading as string)}...</div>
    }

    return (
        <div className="space-y-6">
             <h2 className={`text-2xl font-bold text-gray-800 ${language === 'gu' || language === 'hi' ? 'font-gujarati' : ''}`}>{t.dashboard as string}</h2>
             <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <StatCard title={t.totalReceipts as string} value={formatCurrency(totalReceipts)} color="border-green-500" language={language} />
                <StatCard title={t.totalExpenses as string} value={formatCurrency(totalExpenses)} color="border-red-500" language={language} />
                <StatCard title={t.netBalance as string} value={formatCurrency(netBalance)} color={netBalance >= 0 ? "border-blue-500" : "border-yellow-500"} language={language} />
             </div>
        </div>
    );
};

export default DashboardView;
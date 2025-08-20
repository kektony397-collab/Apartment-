import type { Receipt, Language, ExpenseItem } from '../types';
import { translations } from '../constants';
import { getAdmin } from './db';

// These are globals from the CDN script
declare const jspdf: any;
declare const XLSX: any;

const addGujaratiFont = (doc: any) => {
    // For this implementation, we rely on the PDF viewer's font substitution.
    // A full implementation would require embedding a base64 encoded font file.
    doc.setFont('Helvetica'); // Fallback
};

export async function generateReceiptPDF(receipt: Receipt, language: Language) {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const admin = await getAdmin();
    const t = translations[language];

    if(language === 'gu') addGujaratiFont(doc);

    // Dynamic Header
    if (admin) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text([admin.societyName, admin.societyAddress, admin.societyRegNo], doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    }

    // Receipt Details
    const body = [
        [t.receiptNumber, receipt.receiptNumber],
        [t.recipientName, receipt.name],
        [t.date, receipt.date],
        [t.maintenancePeriod, receipt.maintenancePeriod || 'N/A'],
        [t.amount, receipt.amount.toFixed(2)],
    ];
    
    doc.autoTable({
        startY: 50,
        head: [[language === 'en' ? 'Field' : 'વિગત', language === 'en' ? 'Details' : 'માહિતી']],
        body: body,
        theme: 'grid',
        styles: { font: 'Helvetica' },
        headStyles: { fontStyle: 'bold' }
    });

    const finalY = (doc as any).lastAutoTable.finalY;

    // Total
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${t.total as string}: ${receipt.amount.toFixed(2)}`, 14, finalY + 20);

    // Signature
    if (admin?.signature) {
        doc.addImage(admin.signature, 'PNG', 150, finalY + 15, 40, 20);
        doc.text(admin.name, 150, finalY + 40);
        doc.text(language === 'en' ? 'Authorized Signature' : 'અધિકૃત સહી', 150, finalY + 45);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(t.pdfFooter1 as string, 14, doc.internal.pageSize.getHeight() - 20);
    if(admin) {
      doc.text(`${t.pdfFooter2 as string} ${admin.name}`, 14, doc.internal.pageSize.getHeight() - 15);
    }


    doc.save(`receipt_${receipt.receiptNumber}.pdf`);
}

export async function exportAllReceiptsPDF(receipts: Receipt[], language: Language) {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const admin = await getAdmin();
    const t = translations[language];

    if(language === 'gu') addGujaratiFont(doc);

    if (admin) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text([admin.societyName, admin.societyAddress, admin.societyRegNo], doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    }

    const tableBody = receipts.map(r => [r.receiptNumber, r.name, r.date, r.maintenancePeriod || 'N/A', r.amount.toFixed(2)]);
    const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

    doc.autoTable({
        startY: 50,
        head: [[t.receiptNumber, t.recipientName, t.date, t.maintenancePeriod, t.amount]],
        body: tableBody,
        theme: 'grid',
        styles: { font: 'Helvetica' },
        headStyles: { fontStyle: 'bold' },
        foot: [[t.grandTotal as string, '', '', '', totalAmount.toFixed(2)]],
        footStyles: { fontStyle: 'bold' },
    });

    doc.save('all_receipts.pdf');
}

export function exportAllReceiptsExcel(receipts: Receipt[], language: Language) {
    const t = translations[language];
    const worksheetData = receipts.map(r => ({
        [t.receiptNumber as string]: r.receiptNumber,
        [t.recipientName as string]: r.name,
        [t.date as string]: r.date,
        [t.maintenancePeriod as string]: r.maintenancePeriod || 'N/A',
        [t.amount as string]: r.amount,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts');

    const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
    XLSX.utils.sheet_add_aoa(worksheet, [['', '', '', t.total as string, totalAmount]], { origin: -1 });

    XLSX.writeFile(workbook, 'all_receipts.xlsx');
}

export async function generateExpensePDF(items: ExpenseItem[], total: number, language: Language) {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const admin = await getAdmin();
    const t = translations[language];
    if(language === 'gu') addGujaratiFont(doc);

    // Dynamic Header
    if (admin) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text([admin.societyName, admin.societyAddress, admin.societyRegNo], doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(t.expenseReport as string, doc.internal.pageSize.getWidth() / 2, 45, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${t.date as string}: ${new Date().toLocaleDateString()}`, 14, 55);
    
    const tableBody = items.map(item => [item.name, item.amount.toFixed(2)]);
    
    doc.autoTable({
        startY: 60,
        head: [[t.itemName as string, t.amount as string]],
        body: tableBody,
        theme: 'grid',
        styles: { font: 'Helvetica' },
        headStyles: { fontStyle: 'bold' },
        foot: [[t.grandTotal as string, total.toFixed(2)]],
        footStyles: { fontStyle: 'bold' },
    });

    doc.save('expense_report.pdf');
}

import type { Receipt, Language, ExpenseItem } from '../types';
import { translations } from '../constants';
import { getAdmin } from './db';

// These are globals from the CDN script
declare const jspdf: any;
declare const XLSX: any;

// Helper to add custom fonts to jsPDF (requires font files, which we can't bundle)
// For now, we'll rely on standard fonts and use the language to select text.
// If a Gujarati font was base64 encoded and included, it would be registered here.
// For simplicity, we will render text without embedding fonts. The browser's PDF viewer might substitute.

const addGujaratiFont = (doc: any) => {
    // In a real project with font files, you would add the font file here.
    // doc.addFileToVFS('NotoSansGujarati.ttf', fontInBase64);
    // doc.addFont('NotoSansGujarati.ttf', 'NotoSansGujarati', 'normal');
    // doc.setFont('NotoSansGujarati');
    doc.setFont('Helvetica'); // Fallback
};

const getReceiptHeader = (language: Language) => {
    const t = translations[language];
    return [
        t.pdfHeader1 as string,
        t.pdfHeader2 as string,
        t.pdfHeader3 as string,
        t.pdfHeader4 as string,
    ];
};

const getFooterText = (language: Language) => {
    const t = translations[language];
    return {
        line1: t.pdfFooter1 as string,
        line2: t.pdfFooter2 as string
    };
};

export async function generateReceiptPDF(receipt: Receipt, language: Language) {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const admin = await getAdmin();
    const t = translations[language];

    if(language === 'gu') addGujaratiFont(doc);

    // Header
    const header = getReceiptHeader(language);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(header, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    // Receipt Details
    const body = [
        [t.receiptNumber, receipt.receiptNumber],
        [t.recipientName, receipt.name],
        [t.date, receipt.date],
        [t.amount, receipt.amount.toFixed(2)],
    ];
    
    doc.autoTable({
        startY: 50,
        head: [[language === 'en' ? 'Field' : 'વિગત', language === 'en' ? 'Details' : 'માહિતી']],
        body: body,
        theme: 'grid',
        styles: { font: 'Helvetica' }, // Specify font for table
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
    const footer = getFooterText(language);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(footer.line1, 14, doc.internal.pageSize.getHeight() - 20);
    doc.text(footer.line2, 14, doc.internal.pageSize.getHeight() - 15);


    doc.save(`receipt_${receipt.receiptNumber}.pdf`);
}

export async function exportAllReceiptsPDF(receipts: Receipt[], language: Language) {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const t = translations[language];

    if(language === 'gu') addGujaratiFont(doc);

    const header = getReceiptHeader(language);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(header, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });

    const tableBody = receipts.map(r => [r.receiptNumber, r.name, r.date, r.amount.toFixed(2)]);
    const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
    tableBody.push(['', '', t.total as string, totalAmount.toFixed(2)]);

    doc.autoTable({
        startY: 50,
        head: [[t.receiptNumber, t.recipientName, t.date, t.amount]],
        body: tableBody,
        theme: 'grid',
        styles: { font: 'Helvetica' },
        headStyles: { fontStyle: 'bold' },
        foot: [[t.grandTotal as string, '', '', totalAmount.toFixed(2)]],
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
        [t.amount as string]: r.amount,
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts');

    // Add total row
    const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
    XLSX.utils.sheet_add_aoa(worksheet, [[t.total as string, '', '', totalAmount]], { origin: -1 });

    XLSX.writeFile(workbook, 'all_receipts.xlsx');
}

export function generateExpensePDF(items: ExpenseItem[], total: number, language: Language) {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const t = translations[language];
    if(language === 'gu') addGujaratiFont(doc);

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(t.expenseReport as string, doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`${t.date as string}: ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableBody = items.map(item => [item.name, item.amount.toFixed(2)]);
    
    doc.autoTable({
        startY: 40,
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

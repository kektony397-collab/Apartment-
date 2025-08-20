import type { Admin, Receipt, Language, ExpenseItem } from '../types';
import { translations } from '../constants';
import { getAdmin } from './db';
import { NotoSansGujarati } from '../assets/NotoSansGujarati';
import { NotoSansDevanagari } from '../assets/NotoSansDevanagari';

// These are globals from the CDN script
declare const jspdf: any;
declare const XLSX: any;

const initializeDocWithFonts = (doc: any, language: Language) => {
    if (language === 'gu') {
        doc.addFileToVFS('NotoSansGujarati-Regular.ttf', NotoSansGujarati);
        doc.addFont('NotoSansGujarati-Regular.ttf', 'NotoSansGujarati', 'normal');
        doc.setFont('NotoSansGujarati');
    } else if (language === 'hi') {
        doc.addFileToVFS('NotoSansDevanagari-Regular.ttf', NotoSansDevanagari);
        doc.addFont('NotoSansDevanagari-Regular.ttf', 'NotoSansDevanagari', 'normal');
        doc.setFont('NotoSansDevanagari');
    } else {
        doc.setFont('Helvetica');
    }
};

const drawHeader = (doc: any, admin: Admin | undefined) => {
    const headerHeight = 25;
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(245, 245, 245); // A very light grey
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    if (admin) {
        doc.setFontSize(16);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(33, 33, 33); // Dark Grey
        doc.text(admin.societyName, pageWidth / 2, 10, { align: 'center' });
        doc.setFontSize(9);
        doc.setTextColor(117, 117, 117); // Medium Grey
        doc.text(`${admin.societyAddress} | ${admin.societyRegNo}`, pageWidth / 2, 17, { align: 'center' });
    }
    doc.setDrawColor(224, 224, 224); // Light grey border
    doc.line(0, headerHeight, pageWidth, headerHeight);
};


export async function generateReceiptPDF(receipt: Receipt, language: Language) {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const admin = await getAdmin();
    const t = translations[language];

    drawHeader(doc, admin);
    initializeDocWithFonts(doc, language);

    const startY = 35;
    doc.setFontSize(18);
    doc.setFont(doc.getFont().fontName, 'bold');
    doc.text(t.receipts as string, 14, startY);

    const body = [
        [t.receiptNumber as string, receipt.receiptNumber],
        [t.recipientName as string, receipt.name],
        [t.date as string, receipt.date],
        [t.maintenancePeriod as string, receipt.maintenancePeriod || 'N/A'],
    ];

    doc.autoTable({
        startY: startY + 10,
        body: body,
        theme: 'plain',
        styles: { 
            font: doc.getFont().fontName,
            cellPadding: 3,
            fontSize: 11
        },
        columnStyles: {
            0: { fontStyle: 'bold' }
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY;
    
    // Total Amount Box
    doc.setFontSize(14);
    doc.setFont(doc.getFont().fontName, 'bold');
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, finalY + 10, doc.internal.pageSize.getWidth() - 28, 15, 3, 3, 'F');
    doc.text(t.amount as string, 20, finalY + 20);
    const amountText = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(receipt.amount);
    doc.text(amountText, doc.internal.pageSize.getWidth() - 20, finalY + 20, { align: 'right' });


    finalY += 40; // Adjust space for signature
    
    // Signature
    if (admin?.signature) {
        doc.addImage(admin.signature, 'PNG', 150, finalY, 40, 20);
        doc.setDrawColor(117, 117, 117);
        doc.line(150, finalY + 22, 190, finalY + 22);
        doc.setFontSize(9);
        doc.setTextColor(117, 117, 117);
        doc.text(admin.name, 170, finalY + 27, { align: 'center' });
        doc.text(language === 'en' ? 'Authorized Signature' : (language === 'gu' ? 'અધિકૃત સહી' : 'अधिकृत हस्ताक्षर'), 170, finalY + 31, { align: 'center' });
    }
    
    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(158, 158, 158);
    doc.text(t.pdfFooter1 as string, 14, pageHeight - 15);
    if(admin) {
      doc.text(`${t.pdfFooter2 as string} ${admin.name}`, 14, pageHeight - 10);
    }

    doc.save(`receipt_${receipt.receiptNumber}.pdf`);
}

export async function exportAllReceiptsPDF(receipts: Receipt[], language: Language) {
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const admin = await getAdmin();
    const t = translations[language];

    drawHeader(doc, admin);
    initializeDocWithFonts(doc, language);

    const tableBody = receipts.map(r => [r.receiptNumber, r.name, r.date, r.maintenancePeriod || 'N/A', r.amount.toFixed(2)]);
    const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);

    doc.autoTable({
        startY: 35,
        head: [[t.receiptNumber, t.recipientName, t.date, t.maintenancePeriod, t.amount]],
        body: tableBody,
        theme: 'grid',
        styles: { font: doc.getFont().fontName },
        headStyles: { fontStyle: 'bold', fillColor: [236, 239, 241], textColor: [33, 33, 33] },
        foot: [[t.grandTotal as string, '', '', '', totalAmount.toFixed(2)]],
        footStyles: { fontStyle: 'bold', fillColor: [236, 239, 241], textColor: [33, 33, 33] },
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

    drawHeader(doc, admin);
    initializeDocWithFonts(doc, language);

    doc.setFontSize(16);
    doc.setFont(doc.getFont().fontName, 'bold');
    doc.text(t.expenseReport as string, 14, 35);
    doc.setFontSize(11);
    doc.setFont(doc.getFont().fontName, 'normal');
    doc.setTextColor(117, 117, 117);
    doc.text(`${t.date as string}: ${new Date().toLocaleDateString()}`, 14, 42);
    
    const tableBody = items.map(item => [item.name, item.amount.toFixed(2)]);
    
    doc.autoTable({
        startY: 50,
        head: [[t.itemName as string, t.amount as string]],
        body: tableBody,
        theme: 'grid',
        styles: { font: doc.getFont().fontName },
        headStyles: { fontStyle: 'bold', fillColor: [236, 239, 241], textColor: [33, 33, 33] },
        foot: [[t.grandTotal as string, total.toFixed(2)]],
        footStyles: { fontStyle: 'bold', fillColor: [236, 239, 241], textColor: [33, 33, 33] },
    });

    doc.save('expense_report.pdf');
}
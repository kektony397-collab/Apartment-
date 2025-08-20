import type { Admin, Receipt, ExpenseReport } from '../types';

// These are globals from the CDN script
declare const idb: any;

const DB_NAME = 'ReceiptBookDB';
const DB_VERSION = 2;
const ADMIN_STORE = 'admins';
const RECEIPT_STORE = 'receipts';
const EXPENSE_STORE = 'expenses';
const SETTINGS_STORE = 'settings';

let db: any;

async function connectToDb() {
    if (db) return db;
    db = await idb.openDB(DB_NAME, DB_VERSION, {
        upgrade(db: any, oldVersion: number, newVersion: number | null, tx: any) {
            if (oldVersion < 1) {
                if (!db.objectStoreNames.contains(ADMIN_STORE)) {
                    db.createObjectStore(ADMIN_STORE, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(RECEIPT_STORE)) {
                    const receiptStore = db.createObjectStore(RECEIPT_STORE, { keyPath: 'id', autoIncrement: true });
                    receiptStore.createIndex('receiptNumber', 'receiptNumber', { unique: true });
                    receiptStore.createIndex('name', 'name');
                    receiptStore.createIndex('date', 'date');
                }
            }
            if (oldVersion < 2) {
                if (!db.objectStoreNames.contains(EXPENSE_STORE)) {
                    db.createObjectStore(EXPENSE_STORE, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
                    const settingsStore = db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
                    settingsStore.put({ key: 'lastReceiptNumber', value: 0 });
                }
                
                const adminStore = tx.objectStore(ADMIN_STORE);
                adminStore.get(1).then((admin: Admin) => {
                    if (admin) {
                        admin.societyName = admin.societyName || 'Demo Apartment Division';
                        admin.societyAddress = admin.societyAddress || 'Demo Address';
                        admin.societyRegNo = admin.societyRegNo || 'REG.NO Demo';
                        adminStore.put(admin);
                    }
                });

                const receiptStore = tx.objectStore(RECEIPT_STORE);
                receiptStore.getAll().then((receipts: Receipt[]) => {
                    receipts.forEach(r => {
                        if (typeof r.maintenancePeriod === 'undefined') {
                            r.maintenancePeriod = '';
                            receiptStore.put(r);
                        }
                    });
                });
            }
        },
    });
    return db;
}

async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function initDB() {
    await connectToDb();
}

type AuthStatus = {
    isSetup: boolean;
    authMethod?: 'password' | 'pin';
    username?: string;
}

export async function getAuthStatus(): Promise<AuthStatus> {
    const db = await connectToDb();
    const admin = await db.get(ADMIN_STORE, 1);
    if (admin) {
        return { isSetup: true, authMethod: admin.authMethod, username: admin.username };
    }
    return { isSetup: false };
}

type SetupDetails = {
    authMethod: 'password';
    username: string;
    password: string;
} | {
    authMethod: 'pin';
    pin: string;
}

export async function setupAdmin(details: SetupDetails) {
    const db = await connectToDb();
    let newAdmin: Admin;
    const commonDetails = {
        id: 1,
        name: 'Admin',
        blockNumber: '',
        signature: '',
        societyName: 'Demo Apartment Division',
        societyAddress: 'Demo Address',
        societyRegNo: 'REG.NO Demo',
    };
    if (details.authMethod === 'password') {
        const passwordHash = await sha256(details.password);
        newAdmin = {
            ...commonDetails,
            authMethod: 'password',
            username: details.username,
            passwordHash,
        };
    } else {
        const pinHash = await sha256(details.pin);
        newAdmin = {
            ...commonDetails,
            authMethod: 'pin',
            passwordHash: pinHash,
        }
    }
    await db.put(ADMIN_STORE, newAdmin);
}

export async function verifyPassword(username: string, password: string): Promise<boolean> {
    const db = await connectToDb();
    const admin = await db.get(ADMIN_STORE, 1);
    if (!admin || admin.username !== username) return false;
    const passwordHash = await sha256(password);
    return passwordHash === admin.passwordHash;
}

export async function verifyPin(pin: string): Promise<boolean> {
    const db = await connectToDb();
    const admin = await db.get(ADMIN_STORE, 1);
    if (!admin) return false;
    const pinHash = await sha256(pin);
    return pinHash === admin.passwordHash;
}

export async function getAdmin(): Promise<Admin | undefined> {
    const db = await connectToDb();
    return await db.get(ADMIN_STORE, 1);
}

export async function updateAdmin(adminData: Partial<Admin>) {
    const db = await connectToDb();
    const currentAdmin = await getAdmin();
    if (!currentAdmin) return;
    const updatedAdmin = { ...currentAdmin, ...adminData, id: 1 };
    await db.put(ADMIN_STORE, updatedAdmin);
}

export async function updatePassword(newPassword: string): Promise<void> {
    const db = await connectToDb();
    const admin = await getAdmin();
    if (admin) {
        admin.passwordHash = await sha256(newPassword);
        await db.put(ADMIN_STORE, admin);
    }
}

export async function updatePin(newPin: string): Promise<void> {
    const db = await connectToDb();
    const admin = await getAdmin();
    if (admin) {
        admin.passwordHash = await sha256(newPin);
        await db.put(ADMIN_STORE, admin);
    }
}

export async function addReceipt(receiptData: Omit<Receipt, 'id' | 'receiptNumber'>): Promise<Receipt> {
    const db = await connectToDb();
    const tx = db.transaction([RECEIPT_STORE, SETTINGS_STORE], 'readwrite');
    const settingsStore = tx.objectStore(SETTINGS_STORE);
    const receiptStore = tx.objectStore(RECEIPT_STORE);
    
    const counter = await settingsStore.get('lastReceiptNumber');
    const nextNumber = (counter ? counter.value : 0) + 1;
    
    const newReceipt: Receipt = {
        ...receiptData,
        receiptNumber: `REC-${String(nextNumber).padStart(4, '0')}`
    };

    await settingsStore.put({ key: 'lastReceiptNumber', value: nextNumber });
    await receiptStore.add(newReceipt);
    
    await tx.done;
    return newReceipt;
}

export async function getReceipts(): Promise<Receipt[]> {
    const db = await connectToDb();
    return await db.getAll(RECEIPT_STORE);
}

export async function addExpenseReport(report: Omit<ExpenseReport, 'id'>) {
    const db = await connectToDb();
    await db.add(EXPENSE_STORE, report);
}

export async function getExpenseReports(): Promise<ExpenseReport[]> {
    const db = await connectToDb();
    return await db.getAll(EXPENSE_STORE);
}
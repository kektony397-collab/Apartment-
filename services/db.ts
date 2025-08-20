
import type { Admin, Receipt } from '../types';

// These are globals from the CDN script
declare const idb: any;

const DB_NAME = 'ReceiptBookDB';
const DB_VERSION = 1;
const ADMIN_STORE = 'admins';
const RECEIPT_STORE = 'receipts';

let db: any;

async function connectToDb() {
    if (db) return db;
    db = await idb.openDB(DB_NAME, DB_VERSION, {
        upgrade(db: any) {
            if (!db.objectStoreNames.contains(ADMIN_STORE)) {
                db.createObjectStore(ADMIN_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(RECEIPT_STORE)) {
                const receiptStore = db.createObjectStore(RECEIPT_STORE, { keyPath: 'id', autoIncrement: true });
                receiptStore.createIndex('receiptNumber', 'receiptNumber', { unique: true });
                receiptStore.createIndex('name', 'name');
                receiptStore.createIndex('date', 'date');
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
    if (details.authMethod === 'password') {
        const passwordHash = await sha256(details.password);
        newAdmin = {
            id: 1,
            authMethod: 'password',
            username: details.username,
            passwordHash,
            name: 'Admin',
            blockNumber: '',
            signature: '',
        };
    } else {
        const pinHash = await sha256(details.pin);
        newAdmin = {
            id: 1,
            authMethod: 'pin',
            passwordHash: pinHash,
            name: 'Admin',
            blockNumber: '',
            signature: '',
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


export async function addReceipt(receipt: Receipt) {
    const db = await connectToDb();
    await db.add(RECEIPT_STORE, receipt);
}

export async function getReceipts(): Promise<Receipt[]> {
    const db = await connectToDb();
    return await db.getAll(RECEIPT_STORE);
}

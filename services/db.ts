
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
                db.createObjectStore(ADMIN_STORE, { keyPath: 'id', autoIncrement: true });
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
    const db = await connectToDb();
    const tx = db.transaction(ADMIN_STORE, 'readwrite');
    const store = tx.objectStore(ADMIN_STORE);
    const count = await store.count();
    if (count === 0) {
        const passwordHash = await sha256('google');
        await store.add({
            username: 'admin',
            passwordHash,
            name: 'Default Admin',
            blockNumber: 'A-101',
            signature: '',
        });
    }
    await tx.done;
}

export async function verifyAdmin(password: string): Promise<boolean> {
    const db = await connectToDb();
    const admin = await db.get(ADMIN_STORE, 1);
    if (!admin) return false;
    const passwordHash = await sha256(password);
    return passwordHash === admin.passwordHash;
}

export async function getAdmin(): Promise<Admin | undefined> {
    const db = await connectToDb();
    return await db.get(ADMIN_STORE, 1);
}

export async function updateAdmin(adminData: Admin) {
    const db = await connectToDb();
    // Ensure we are updating the first admin record
    const adminWithId = { ...adminData, id: 1 };
    await db.put(ADMIN_STORE, adminWithId);
}

export async function addReceipt(receipt: Receipt) {
    const db = await connectToDb();
    await db.add(RECEIPT_STORE, receipt);
}

export async function getReceipts(): Promise<Receipt[]> {
    const db = await connectToDb();
    return await db.getAll(RECEIPT_STORE);
}

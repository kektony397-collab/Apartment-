
export interface Admin {
  id?: number;
  username?: string; // Only for 'password' auth
  passwordHash?: string; // Hash for password or PIN
  authMethod: 'password' | 'pin';
  name: string;
  blockNumber: string;
  signature: string; // base64 data URL
}

export interface Receipt {
  id?: number;
  receiptNumber: string;
  name: string;
  date: string; // YYYY-MM-DD
  amount: number;
}

export interface ExpenseItem {
    name: string;
    amount: number;
}

export type Language = 'en' | 'gu';

export type Translation = {
    [key: string]: string | { [key: string]: string };
};

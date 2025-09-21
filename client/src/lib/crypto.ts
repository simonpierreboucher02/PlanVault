import CryptoJS from 'crypto-js';

export function encryptData(data: any, key: string): string {
  const jsonString = JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonString, key).toString();
}

export function decryptData<T>(encryptedData: string, key: string): T | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString) as T;
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return null;
  }
}

export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

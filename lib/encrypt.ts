/**
 * Credential encryption/decryption using AES (crypto-js)
 * Used to securely store platform API credentials in the database
 */
import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = process.env.JWT_SECRET || "fallback-secret";

export function encryptCredentials(credentials: Record<string, unknown>): string {
  const json = JSON.stringify(credentials);
  return CryptoJS.AES.encrypt(json, ENCRYPTION_KEY).toString();
}

export function decryptCredentials(encrypted: string): Record<string, unknown> {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  const json = bytes.toString(CryptoJS.enc.Utf8);
  if (!json) throw new Error("Failed to decrypt credentials");
  return JSON.parse(json);
}

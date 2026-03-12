import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn("[Encryption] ENCRYPTION_KEY not set - using fallback (NOT SECURE FOR PRODUCTION)");
    return crypto.scryptSync("default-dev-key", "salt", 32);
  }
  return Buffer.from(key, "base64");
}

export function encrypt(text: string): string {
  if (!text) return text;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decrypt(encryptedData: string): string {
  if (!encryptedData || !encryptedData.includes(":")) {
    return encryptedData;
  }
  
  try {
    const [ivB64, authTagB64, dataB64] = encryptedData.split(":");
    
    if (!ivB64 || !authTagB64 || !dataB64) {
      return encryptedData;
    }
    
    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const encrypted = Buffer.from(dataB64, "base64");
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("[Encryption] Decryption failed:", error);
    return encryptedData;
  }
}

export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(":");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

export function encryptObject<T extends Record<string, unknown>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fieldsToEncrypt) {
    const value = result[field];
    if (typeof value === "string") {
      (result[field] as string) = encrypt(value);
    }
  }
  return result;
}

export function decryptObject<T extends Record<string, unknown>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of fieldsToDecrypt) {
    const value = result[field];
    if (typeof value === "string" && isEncrypted(value)) {
      (result[field] as string) = decrypt(value);
    }
  }
  return result;
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("base64");
}

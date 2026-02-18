import crypto from 'crypto';

/**
 * Core Security - Encryption
 * Encriptación AES-256 para datos sensibles
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Genera o recupera la key de encriptación desde env
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        console.warn('⚠️ ENCRYPTION_KEY not set. Using fallback (INSECURE for production!)');
        // En desarrollo, usar una key fija (NO HACER ESTO EN PRODUCCIÓN)
        return crypto.createHash('sha256').update('dev-encryption-key-change-in-prod').digest();
    }

    // La key debe ser hex de 64 caracteres (32 bytes)
    if (key.length !== 64) {
        throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
    }

    return Buffer.from(key, 'hex');
}

/**
 * Encripta un string usando AES-256-GCM
 * @param plaintext - Texto a encriptar
 * @returns String encriptado en formato: iv:authTag:ciphertext (hex)
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Formato: iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
}

/**
 * Desencripta un string encriptado con encrypt()
 * @param encrypted - String en formato iv:authTag:ciphertext
 * @returns Texto plano original
 */
export function decrypt(encrypted: string): string {
    const key = getEncryptionKey();
    const parts = encrypted.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
    }

    const [ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
}

/**
 * 🔐 BCRYPT PASSWORD HASHING (Grado Industrial)
 * Salt rounds: 10 (2^10 = 1024 iterations)
 */

import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt (Production-grade)
 * @param password - Password en texto plano
 * @returns Hash bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Verifica password contra hash bcrypt
 * @param password - Password en texto plano
 * @param hash - Hash bcrypt
 * @returns true si coincide
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * @deprecated Legacy SHA-256 hash (solo para migración)
 * NO USAR para nuevos passwords
 */
export function hashPasswordSHA256(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Detecta si un hash es formato SHA-256 legacy
 * @param hash - Hash a verificar
 * @returns true si es SHA-256 (64 caracteres hex)
 */
export function isLegacyHash(hash: string): boolean {
    return /^[a-f0-9]{64}$/.test(hash);
}

/**
 * Verifica password contra hash legacy SHA-256
 * @deprecated Solo para migración lazy
 */
export function verifyPasswordLegacy(password: string, hash: string): boolean {
    const passwordHash = hashPasswordSHA256(password);
    return secureCompare(passwordHash, hash);
}

/**
 * Genera un token aleatorio seguro
 * @param length - Longitud en bytes (default: 32)
 * @returns Token hex
 */
export function generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Compara dos strings de forma segura contra timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

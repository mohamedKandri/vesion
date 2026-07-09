import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? '';
  const key = Buffer.from(hex, 'hex');
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes of hex (openssl rand -hex 32)');
  }
  return key;
}

/** AES-256-GCM encryption for secrets at rest (e.g. TOTP seeds). Output: iv.tag.ciphertext (base64). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(payload: string): string {
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const data = raw.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

/** One-way hash for tokens stored in the database (refresh/verification tokens). */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Cryptographically random URL-safe token. */
export function generateToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

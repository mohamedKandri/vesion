import { decryptSecret, encryptSecret, generateToken, hashToken } from './crypto';

describe('crypto utils', () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes hex for tests only
  });

  describe('encryptSecret / decryptSecret', () => {
    it('round-trips a secret', () => {
      const secret = 'JBSWY3DPEHPK3PXP';
      expect(decryptSecret(encryptSecret(secret))).toBe(secret);
    });

    it('produces a different ciphertext each time (random IV)', () => {
      expect(encryptSecret('same-input')).not.toBe(encryptSecret('same-input'));
    });

    it('rejects tampered ciphertext (GCM auth tag)', () => {
      const payload = Buffer.from(encryptSecret('secret'), 'base64');
      payload[payload.length - 1] ^= 0xff;
      expect(() => decryptSecret(payload.toString('base64'))).toThrow();
    });

    it('rejects an invalid key length', () => {
      const original = process.env.ENCRYPTION_KEY;
      process.env.ENCRYPTION_KEY = 'deadbeef';
      expect(() => encryptSecret('x')).toThrow(/32 bytes/);
      process.env.ENCRYPTION_KEY = original;
    });
  });

  describe('hashToken', () => {
    it('is deterministic and one-way-shaped', () => {
      const token = generateToken();
      expect(hashToken(token)).toBe(hashToken(token));
      expect(hashToken(token)).toHaveLength(64);
      expect(hashToken(token)).not.toContain(token);
    });
  });

  describe('generateToken', () => {
    it('generates unique URL-safe tokens', () => {
      const a = generateToken();
      const b = generateToken();
      expect(a).not.toBe(b);
      expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });
});

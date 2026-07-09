import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../../infrastructure/mail/mail.service';

const CONFIG: Record<string, unknown> = {
  'auth.bcryptRounds': 4, // fast hashing in tests
  'auth.accessSecret': 'test-access-secret',
  'auth.accessTtl': 900,
  'auth.refreshTtl': 2592000,
  webUrl: 'http://localhost:3000',
};

function createPrismaMock() {
  return {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    },
    verificationToken: { create: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let mail: { send: jest.Mock };

  beforeEach(async () => {
    prisma = createPrismaMock();
    mail = { send: jest.fn().mockResolvedValue(undefined) };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: PrismaService, useValue: prisma },
        { provide: MailService, useValue: mail },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => CONFIG[key]) },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('creates a user and sends a verification email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'jane@acme.com',
        firstName: 'Jane',
      });
      prisma.verificationToken.create.mockResolvedValue({});

      const result = await service.register({
        email: 'Jane@Acme.com',
        password: 'Sup3rSecretPass',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(result.message).toMatch(/verify/i);
      // Email addresses are normalized to lowercase.
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'jane@acme.com', role: 'CLIENT' }),
        }),
      );
      expect(mail.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'jane@acme.com', subject: expect.stringContaining('Verify') }),
      );
      // Password is never stored in plaintext.
      const passwordHash = prisma.user.create.mock.calls[0][0].data.passwordHash;
      expect(passwordHash).not.toBe('Sup3rSecretPass');
      expect(await bcrypt.compare('Sup3rSecretPass', passwordHash)).toBe(true);
    });

    it('rejects duplicate emails', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({
          email: 'jane@acme.com',
          password: 'Sup3rSecretPass',
          firstName: 'Jane',
          lastName: 'Doe',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    const baseUser = async () => ({
      id: 'u1',
      email: 'jane@acme.com',
      passwordHash: await bcrypt.hash('Sup3rSecretPass', 4),
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'CLIENT',
      isActive: true,
      emailVerifiedAt: new Date(),
      twoFactorEnabled: false,
      twoFactorSecret: null,
      avatarUrl: null,
      companyId: null,
    });

    it('returns tokens for valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(await baseUser());
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      const result = await service.login({ email: 'jane@acme.com', password: 'Sup3rSecretPass' });

      expect(result.tokens?.accessToken).toBeDefined();
      expect(result.tokens?.refreshToken).toBeDefined();
      expect(result.user?.email).toBe('jane@acme.com');
      // Refresh token is stored hashed, never raw.
      const stored = prisma.refreshToken.create.mock.calls[0][0].data.tokenHash;
      expect(stored).not.toBe(result.tokens?.refreshToken);
    });

    it('rejects a wrong password with a generic message', async () => {
      prisma.user.findUnique.mockResolvedValue(await baseUser());
      await expect(
        service.login({ email: 'jane@acme.com', password: 'WrongPassword1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects unverified accounts', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...(await baseUser()), emailVerifiedAt: null });
      await expect(
        service.login({ email: 'jane@acme.com', password: 'Sup3rSecretPass' }),
      ).rejects.toThrow(/verify/i);
    });

    it('requires a TOTP code when 2FA is enabled', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...(await baseUser()), twoFactorEnabled: true });
      const result = await service.login({ email: 'jane@acme.com', password: 'Sup3rSecretPass' });
      expect(result).toEqual({ twoFactorRequired: true });
    });
  });

  describe('refresh', () => {
    it('rejects unknown refresh tokens', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('bogus')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('revokes the whole session family on token reuse', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt1',
        userId: 'u1',
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 10_000),
        user: { id: 'u1', isActive: true },
      });

      await expect(service.refresh('reused-token')).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: 'u1' }) }),
      );
    });
  });

  describe('forgotPassword', () => {
    it('returns a uniform message whether or not the account exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const missing = await service.forgotPassword({ email: 'ghost@nowhere.com' });

      prisma.user.findUnique.mockResolvedValue({ id: 'u1', email: 'jane@acme.com', firstName: 'Jane' });
      prisma.verificationToken.create.mockResolvedValue({});
      const existing = await service.forgotPassword({ email: 'jane@acme.com' });

      expect(missing.message).toBe(existing.message);
      expect(mail.send).toHaveBeenCalledTimes(1);
    });
  });
});

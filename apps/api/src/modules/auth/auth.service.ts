import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenType, User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { decryptSecret, encryptSecret, generateToken, hashToken } from '../../common/utils/crypto';
import type { AuthUser } from '../../common/types/auth-user';
import {
  ChangePasswordDto,
  DisableTwoFactorDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult {
  twoFactorRequired?: boolean;
  tokens?: TokenPair;
  user?: PublicUser;
}

export type PublicUser = Pick<
  User,
  | 'id'
  | 'email'
  | 'firstName'
  | 'lastName'
  | 'role'
  | 'avatarUrl'
  | 'companyId'
  | 'twoFactorEnabled'
  | 'emailVerifiedAt'
>;

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  avatarUrl: true,
  companyId: true,
  twoFactorEnabled: true,
  emailVerifiedAt: true,
} as const;

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  // ── Registration & verification ──────────────────────────────

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, this.config.get<number>('auth.bcryptRounds')!);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.CLIENT,
        company: dto.companyName ? { create: { name: dto.companyName } } : undefined,
      },
    });

    await this.issueVerificationEmail(user.id, user.email, user.firstName);
    await this.audit(user.id, 'auth.register');
    return { message: 'Account created. Please check your email to verify your address.' };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<{ message: string }> {
    const record = await this.consumeToken(dto.token, TokenType.EMAIL_VERIFICATION);
    await this.prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    });
    await this.audit(record.userId, 'auth.email_verified');
    return { message: 'Email verified successfully. You can now sign in.' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user && !user.emailVerifiedAt) {
      await this.issueVerificationEmail(user.id, user.email, user.firstName);
    }
    return { message: 'If the account exists and is unverified, a new email has been sent.' };
  }

  // ── Login / refresh / logout ─────────────────────────────────

  async login(dto: LoginDto, ip?: string, userAgent?: string): Promise<LoginResult> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    const passwordOk = user ? await bcrypt.compare(dto.password, user.passwordHash) : false;

    if (!user || !passwordOk) {
      await this.audit(user?.id ?? null, 'auth.login_failed', { email: dto.email, ip });
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) throw new UnauthorizedException('This account has been deactivated');
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Please verify your email address before signing in');
    }

    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) return { twoFactorRequired: true };
      this.assertTotp(user, dto.twoFactorCode);
    }

    const tokens = await this.issueTokens(user, ip, userAgent);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await this.audit(user.id, 'auth.login', { ip });

    return { tokens, user: this.toPublicUser(user) };
  }

  async refresh(rawToken: string, ip?: string, userAgent?: string): Promise<TokenPair> {
    const tokenHash = hashToken(rawToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      // Reuse of a revoked token indicates possible theft — revoke the whole family.
      if (stored?.revokedAt) {
        await this.prisma.refreshToken.updateMany({
          where: { userId: stored.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        await this.audit(stored.userId, 'auth.refresh_token_reuse_detected');
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (!stored.user.isActive) throw new UnauthorizedException('Account is deactivated');

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(stored.user, ip, userAgent);
  }

  async logout(rawToken: string | undefined, userId: string): Promise<{ message: string }> {
    if (rawToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(rawToken), userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    await this.audit(userId, 'auth.logout');
    return { message: 'Signed out' };
  }

  async listSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, ip: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string): Promise<{ message: string }> {
    await this.prisma.refreshToken.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit(userId, 'auth.session_revoked', { sessionId });
    return { message: 'Session revoked' };
  }

  // ── Password management ──────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (user) {
      const raw = generateToken();
      await this.prisma.verificationToken.create({
        data: {
          tokenHash: hashToken(raw),
          type: TokenType.PASSWORD_RESET,
          userId: user.id,
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });
      const url = `${this.config.get('webUrl')}/reset-password?token=${raw}`;
      await this.mail.send({
        to: user.email,
        subject: 'Reset your Vesion password',
        heading: `Hi ${user.firstName}, reset your password`,
        bodyLines: [
          'We received a request to reset the password for your Vesion account.',
          'This link is valid for 1 hour. If you did not request a reset, no action is needed.',
        ],
        cta: { label: 'Reset password', url },
      });
    }
    // Uniform response prevents account enumeration.
    return { message: 'If an account exists for this email, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const record = await this.consumeToken(dto.token, TokenType.PASSWORD_RESET);
    const passwordHash = await bcrypt.hash(dto.password, this.config.get<number>('auth.bcryptRounds')!);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      this.prisma.refreshToken.updateMany({
        where: { userId: record.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await this.audit(record.userId, 'auth.password_reset');
    return { message: 'Password updated. Please sign in with your new password.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, this.config.get<number>('auth.bcryptRounds')!);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.audit(userId, 'auth.password_changed');
    return { message: 'Password changed successfully' };
  }

  // ── Two-factor authentication ────────────────────────────────

  async setupTwoFactor(userId: string): Promise<{ otpauthUrl: string; qrCodeDataUrl: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.twoFactorEnabled) throw new BadRequestException('Two-factor authentication is already enabled');

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, 'Vesion', secret);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: encryptSecret(secret) },
    });
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { otpauthUrl, qrCodeDataUrl };
  }

  async enableTwoFactor(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.twoFactorSecret) throw new BadRequestException('Run 2FA setup first');
    this.assertTotp(user, code);
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    await this.audit(userId, 'auth.2fa_enabled');
    return { message: 'Two-factor authentication enabled' };
  }

  async disableTwoFactor(userId: string, dto: DisableTwoFactorDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new BadRequestException('Password is incorrect');
    this.assertTotp(user, dto.code);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    await this.audit(userId, 'auth.2fa_disabled');
    return { message: 'Two-factor authentication disabled' };
  }

  // ── Helpers ──────────────────────────────────────────────────

  async me(userId: string): Promise<PublicUser> {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });
  }

  private async issueTokens(user: User, ip?: string, userAgent?: string): Promise<TokenPair> {
    const accessTtl = this.config.get<number>('auth.accessTtl')!;
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: this.config.get<string>('auth.accessSecret'), expiresIn: accessTtl },
    );

    const refreshToken = generateToken();
    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        ip,
        userAgent: userAgent?.slice(0, 255),
        expiresAt: new Date(Date.now() + this.config.get<number>('auth.refreshTtl')! * 1000),
      },
    });

    return { accessToken, refreshToken, expiresIn: accessTtl };
  }

  private assertTotp(user: User, code: string): void {
    if (!user.twoFactorSecret) throw new UnauthorizedException('Two-factor authentication not configured');
    const secret = decryptSecret(user.twoFactorSecret);
    if (!authenticator.verify({ token: code, secret })) {
      throw new UnauthorizedException('Invalid two-factor code');
    }
  }

  private async consumeToken(rawToken: string, type: TokenType) {
    const record = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: hashToken(rawToken) },
    });
    if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException('This link is invalid or has expired');
    }
    await this.prisma.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return record;
  }

  private async issueVerificationEmail(userId: string, email: string, firstName: string) {
    const raw = generateToken();
    await this.prisma.verificationToken.create({
      data: {
        tokenHash: hashToken(raw),
        type: TokenType.EMAIL_VERIFICATION,
        userId,
        expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
      },
    });
    const url = `${this.config.get('webUrl')}/verify-email?token=${raw}`;
    await this.mail.send({
      to: email,
      subject: 'Verify your Vesion account',
      heading: `Welcome to Vesion, ${firstName}!`,
      bodyLines: [
        'Confirm your email address to activate your account and access your client dashboard.',
        'This link is valid for 24 hours.',
      ],
      cta: { label: 'Verify email', url },
    });
  }

  private toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatarUrl: user.avatarUrl,
      companyId: user.companyId,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  }

  private async audit(userId: string | null, action: string, metadata?: Record<string, unknown>) {
    try {
      await this.prisma.auditLog.create({
        data: { userId, action, metadata: metadata as object | undefined },
      });
    } catch (err) {
      this.logger.warn(`Audit write failed for ${action}: ${(err as Error).message}`);
    }
  }
}

export type { AuthUser };

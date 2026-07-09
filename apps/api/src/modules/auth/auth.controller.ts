import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  ChangePasswordDto,
  DisableTwoFactorDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  TwoFactorCodeDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

const REFRESH_COOKIE = 'vesion_refresh';

const STRICT_THROTTLE = { default: { ttl: 60_000, limit: 5 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(STRICT_THROTTLE)
  @Post('register')
  @ApiOperation({ summary: 'Create a new client account' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Throttle(STRICT_THROTTLE)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email/password (+ optional 2FA code)' })
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto, req.ip, req.headers['user-agent']);
    if (result.tokens) this.setRefreshCookie(res, result.tokens.refreshToken);
    return result;
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the refresh token and get a new access token' })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = dto.refreshToken ?? (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? '';
    const tokens = await this.auth.refresh(raw, req.ip, req.headers['user-agent']);
    this.setRefreshCookie(res, tokens.refreshToken);
    return tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke the current session' })
  async logout(
    @CurrentUser() user: AuthUser,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions());
    return this.auth.logout(raw, user.id);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Public()
  @Throttle(STRICT_THROTTLE)
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address with a token' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto);
  }

  @Public()
  @Throttle(STRICT_THROTTLE)
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend the email verification link' })
  resendVerification(@Body() dto: ForgotPasswordDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Public()
  @Throttle(STRICT_THROTTLE)
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request a password reset link' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Throttle(STRICT_THROTTLE)
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with a token' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Change the current password' })
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto);
  }

  @Post('2fa/setup')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Generate a TOTP secret and QR code' })
  setupTwoFactor(@CurrentUser() user: AuthUser) {
    return this.auth.setupTwoFactor(user.id);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Confirm and enable 2FA' })
  enableTwoFactor(@CurrentUser() user: AuthUser, @Body() dto: TwoFactorCodeDto) {
    return this.auth.enableTwoFactor(user.id, dto.code);
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Disable 2FA (requires password + code)' })
  disableTwoFactor(@CurrentUser() user: AuthUser, @Body() dto: DisableTwoFactorDto) {
    return this.auth.disableTwoFactor(user.id, dto);
  }

  @Get('sessions')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List active sessions (refresh tokens)' })
  sessions(@CurrentUser() user: AuthUser) {
    return this.auth.listSessions(user.id);
  }

  @Delete('sessions/:id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke a specific session' })
  revokeSession(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.auth.revokeSession(user.id, id);
  }

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, this.cookieOptions());
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/api/v1/auth',
      maxAge: parseInt(process.env.JWT_REFRESH_TTL ?? '2592000', 10) * 1000,
    };
  }
}

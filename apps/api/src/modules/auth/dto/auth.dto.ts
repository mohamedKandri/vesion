import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const PASSWORD_RULES = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
const PASSWORD_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, and one digit';

export class RegisterDto {
  @ApiProperty({ example: 'jane@acme.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ minLength: 10, example: 'Sup3rSecretPass' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(PASSWORD_RULES, { message: PASSWORD_MESSAGE })
  password: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName: string;

  @ApiPropertyOptional({ example: 'Acme Inc.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  companyName?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'jane@acme.com' })
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ description: '6-digit TOTP code when 2FA is enabled' })
  @IsOptional()
  @IsString()
  @Length(6, 6)
  twoFactorCode?: string;
}

export class RefreshDto {
  @ApiPropertyOptional({ description: 'Refresh token; falls back to the httpOnly cookie' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(PASSWORD_RULES, { message: PASSWORD_MESSAGE })
  password: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class TwoFactorCodeDto {
  @ApiProperty({ description: '6-digit TOTP code' })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class DisableTwoFactorDto extends TwoFactorCodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ minLength: 10 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(PASSWORD_RULES, { message: PASSWORD_MESSAGE })
  newPassword: string;
}

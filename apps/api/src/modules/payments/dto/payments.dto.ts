import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscountType, PaymentMethod, PaymentStatus } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListPaymentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  invoiceId?: string;
}

export class RecordPaymentDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.BANK_TRANSFER })
  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Bank/transaction reference' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}

export class RefundPaymentDto {
  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class CreateTaxRateDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  ratePercent: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class CreateDiscountCodeDto {
  @ApiProperty({ example: 'LAUNCH20' })
  @IsString()
  @Matches(/^[A-Z0-9_-]{3,40}$/, { message: 'Code must be 3–40 uppercase letters, digits, - or _' })
  code: string;

  @ApiProperty({ enum: DiscountType })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  value: number;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateDiscountCodeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

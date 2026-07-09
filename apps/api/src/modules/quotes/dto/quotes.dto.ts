import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuoteStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QuoteItemDto {
  @ApiProperty()
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class ListQuotesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: QuoteStatus })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class CreateQuoteDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiProperty()
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  taxRateId?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiProperty({ type: [QuoteItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];
}

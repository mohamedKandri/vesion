import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListSubscriptionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiProperty()
  @IsUUID()
  planId: string;
}

export class ChangePlanDto {
  @ApiProperty()
  @IsUUID()
  planId: string;
}

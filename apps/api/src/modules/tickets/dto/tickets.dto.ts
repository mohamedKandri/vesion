import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListTicketsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;
}

export class CreateTicketDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  subject: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  description: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}

export class CreateTicketMessageDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body: string;

  @ApiPropertyOptional({ description: 'Internal staff note, hidden from the client', default: false })
  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}

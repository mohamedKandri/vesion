import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateContactSubmissionDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name: string;

  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @ApiPropertyOptional({ example: 'Web Application' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  service?: string;

  @ApiPropertyOptional({ example: '$25k–$50k' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  budget?: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;
}

export class ListSubmissionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ContactStatus })
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;
}

export class UpdateSubmissionStatusDto {
  @ApiProperty({ enum: ContactStatus })
  @IsEnum(ContactStatus)
  status: ContactStatus;
}

export class SubscribeNewsletterDto {
  @ApiProperty()
  @IsEmail()
  @MaxLength(254)
  email: string;
}

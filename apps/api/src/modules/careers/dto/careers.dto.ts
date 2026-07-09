import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus, EmploymentType } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateJobPostingDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(80)
  department: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  location: string;

  @ApiPropertyOptional({ enum: EmploymentType, default: EmploymentType.FULL_TIME })
  @IsOptional()
  @IsEnum(EmploymentType)
  type?: EmploymentType;

  @ApiProperty({ description: 'Markdown job description' })
  @IsString()
  @MaxLength(50000)
  description: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(300, { each: true })
  requirements?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  salaryRange?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;
}

export class ApplyDto {
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
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  coverLetter?: string;
}

export class UpdateApplicationStatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  status: ApplicationStatus;
}

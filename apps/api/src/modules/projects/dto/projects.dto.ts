import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MilestoneStatus, ProjectStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListProjectsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;
}

export class CreateProjectDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class UpdateProjectDto extends CreateProjectDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  declare name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  declare companyId: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}

export class AddMemberDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ default: 'Contributor' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  roleTitle?: string;
}

export class CreateMilestoneDto {
  @ApiProperty()
  @IsString()
  @MaxLength(160)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateMilestoneDto extends CreateMilestoneDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  declare title: string;

  @ApiPropertyOptional({ enum: MilestoneStatus })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListPortfolioQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  technology?: string;

  @ApiPropertyOptional({ description: 'Only case studies' })
  @IsOptional()
  @IsBoolean()
  caseStudiesOnly?: boolean;

  @ApiPropertyOptional({ description: 'Only featured items' })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ enum: PostStatus, description: 'Staff only' })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}

export class CreatePortfolioItemDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  summary: string;

  @ApiProperty({ description: 'Markdown content' })
  @IsString()
  @MaxLength(100000)
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  technologies?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  projectUrl?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCaseStudy?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  challenge?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  solution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  results?: string;

  @ApiPropertyOptional({ description: 'Array of { label, value } metric objects' })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  metrics?: Record<string, string>[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ enum: PostStatus, default: PostStatus.DRAFT })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdatePortfolioItemDto extends CreatePortfolioItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  declare title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare summary: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  declare content: string;
}

export class CreateTestimonialDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  authorName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  authorRole: string;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  companyName: string;

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  quote: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateFaqDto {
  @ApiProperty()
  @IsString()
  @MaxLength(300)
  question: string;

  @ApiProperty()
  @IsString()
  @MaxLength(3000)
  answer: string;

  @ApiPropertyOptional({ default: 'General' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

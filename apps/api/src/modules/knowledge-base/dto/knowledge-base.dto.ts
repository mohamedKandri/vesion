import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListArticlesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Category slug' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional({ enum: PostStatus, description: 'Staff only; clients always see PUBLISHED' })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}

export class CreateKbCategoryDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class CreateArticleDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  excerpt: string;

  @ApiProperty({ description: 'Markdown body' })
  @IsString()
  @MaxLength(100000)
  body: string;

  @ApiProperty()
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  keywords?: string[];

  @ApiPropertyOptional({ enum: PostStatus, default: PostStatus.DRAFT })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}

export class UpdateArticleDto extends CreateArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  declare title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  declare excerpt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100000)
  declare body: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  declare categoryId: string;
}

export class ArticleFeedbackDto {
  @ApiProperty({ description: 'true = helpful, false = not helpful' })
  @IsBoolean()
  helpful: boolean;
}

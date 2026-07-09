import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListPostsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Category slug' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  tag?: string;

  @ApiPropertyOptional({ enum: PostStatus, description: 'Staff only' })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}

export class CreateBlogCategoryDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  name: string;
}

export class CreatePostDto {
  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  excerpt: string;

  @ApiProperty({ description: 'Markdown content' })
  @IsString()
  @MaxLength(200000)
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 120 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  readingMinutes?: number;

  @ApiPropertyOptional({ enum: PostStatus, default: PostStatus.DRAFT })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}

export class UpdatePostDto extends CreatePostDto {
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
  @MaxLength(200000)
  declare content: string;
}

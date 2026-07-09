import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BlogService } from './blog.service';
import { CreateBlogCategoryDto, CreatePostDto, ListPostsQueryDto, UpdatePostDto } from './dto/blog.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

function isStaff(user?: AuthUser): boolean {
  return !!user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER);
}

@ApiTags('Blog')
@Controller('blog')
export class BlogController {
  constructor(private readonly blog: BlogService) {}

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List blog categories' })
  categories() {
    return this.blog.listCategories();
  }

  @Post('categories')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a blog category' })
  createCategory(@Body() dto: CreateBlogCategoryDto) {
    return this.blog.createCategory(dto);
  }

  @Public()
  @Get('posts')
  @ApiOperation({ summary: 'List published posts (staff can filter by status)' })
  findAll(@Query() query: ListPostsQueryDto, @CurrentUser() user?: AuthUser) {
    return this.blog.findAll(query, isStaff(user));
  }

  @Public()
  @Get('posts/:slug')
  @ApiOperation({ summary: 'Read a post with related articles' })
  findBySlug(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.blog.findBySlug(slug, isStaff(user));
  }

  @Post('posts')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a post' })
  create(@Body() dto: CreatePostDto, @CurrentUser() user: AuthUser) {
    return this.blog.create(dto, user);
  }

  @Patch('posts/:id')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a post' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePostDto) {
    return this.blog.update(id, dto);
  }

  @Delete('posts/:id')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a post' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.blog.remove(id);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { KnowledgeBaseService } from './knowledge-base.service';
import {
  ArticleFeedbackDto,
  CreateArticleDto,
  CreateKbCategoryDto,
  ListArticlesQueryDto,
  UpdateArticleDto,
} from './dto/knowledge-base.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

function isStaff(user?: AuthUser): boolean {
  return (
    !!user &&
    (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER || user.role === UserRole.DEVELOPER)
  );
}

@ApiTags('Knowledge base')
@Controller('knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly kb: KnowledgeBaseService) {}

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'List KB categories with article counts' })
  categories() {
    return this.kb.listCategories();
  }

  @Post('categories')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a KB category' })
  createCategory(@Body() dto: CreateKbCategoryDto) {
    return this.kb.createCategory(dto);
  }

  @Public()
  @Get('articles')
  @ApiOperation({ summary: 'List/search published articles' })
  findAll(@Query() query: ListArticlesQueryDto, @CurrentUser() user?: AuthUser) {
    return this.kb.findAll(query, isStaff(user));
  }

  @Public()
  @Get('articles/:slug')
  @ApiOperation({ summary: 'Read an article by slug' })
  findBySlug(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.kb.findBySlug(slug, isStaff(user));
  }

  @Public()
  @Post('articles/:slug/feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark an article as helpful / not helpful' })
  feedback(@Param('slug') slug: string, @Body() dto: ArticleFeedbackDto) {
    return this.kb.feedback(slug, dto);
  }

  @Post('articles')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create an article' })
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: AuthUser) {
    return this.kb.create(dto, user);
  }

  @Patch('articles/:id')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update an article' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateArticleDto) {
    return this.kb.update(id, dto);
  }

  @Delete('articles/:id')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an article' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.kb.remove(id);
  }
}

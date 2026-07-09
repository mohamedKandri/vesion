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
import { PortfolioService } from './portfolio.service';
import {
  CreatePortfolioItemDto,
  ListPortfolioQueryDto,
  UpdatePortfolioItemDto,
} from './dto/portfolio.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

function isStaff(user?: AuthUser): boolean {
  return !!user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER);
}

@ApiTags('Portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List portfolio items / case studies' })
  findAll(@Query() query: ListPortfolioQueryDto, @CurrentUser() user?: AuthUser) {
    return this.portfolio.findAll(query, isStaff(user));
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get a portfolio item by slug' })
  findBySlug(@Param('slug') slug: string, @CurrentUser() user?: AuthUser) {
    return this.portfolio.findBySlug(slug, isStaff(user));
  }

  @Post()
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a portfolio item' })
  create(@Body() dto: CreatePortfolioItemDto) {
    return this.portfolio.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a portfolio item' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePortfolioItemDto) {
    return this.portfolio.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a portfolio item' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.portfolio.remove(id);
  }
}

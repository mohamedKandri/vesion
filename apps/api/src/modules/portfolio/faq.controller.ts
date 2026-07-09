import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PortfolioService } from './portfolio.service';
import { CreateFaqDto } from './dto/portfolio.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('FAQ')
@Controller('faq')
export class FaqController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published FAQ items grouped by category' })
  list(@CurrentUser() user?: AuthUser) {
    const staff = !!user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER);
    return this.portfolio.listFaq(staff);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a FAQ item' })
  create(@Body() dto: CreateFaqDto) {
    return this.portfolio.createFaq(dto);
  }

  @Patch(':id')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a FAQ item' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateFaqDto) {
    return this.portfolio.updateFaq(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a FAQ item' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.portfolio.removeFaq(id);
  }
}

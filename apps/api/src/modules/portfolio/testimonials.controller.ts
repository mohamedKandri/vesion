import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PortfolioService } from './portfolio.service';
import { CreateTestimonialDto } from './dto/portfolio.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Testimonials')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published testimonials' })
  list(@CurrentUser() user?: AuthUser) {
    const staff = !!user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER);
    return this.portfolio.listTestimonials(staff);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a testimonial' })
  create(@Body() dto: CreateTestimonialDto) {
    return this.portfolio.createTestimonial(dto);
  }

  @Delete(':id')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a testimonial' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.portfolio.removeTestimonial(id);
  }
}

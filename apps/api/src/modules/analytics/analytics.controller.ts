import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AnalyticsService } from './analytics.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('admin')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Admin dashboard KPIs, revenue series, and distributions' })
  adminOverview() {
    return this.analytics.adminOverview();
  }

  @Get('client')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Client dashboard overview' })
  clientOverview(@CurrentUser() user: AuthUser) {
    return this.analytics.clientOverview(user);
  }

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Public marketing statistics' })
  publicStats() {
    return this.analytics.publicStats();
  }
}

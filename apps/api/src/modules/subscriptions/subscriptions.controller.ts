import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { ChangePlanDto, CreateSubscriptionDto, ListSubscriptionsQueryDto } from './dto/subscriptions.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Public pricing plans' })
  plans() {
    return this.subscriptions.listPlans();
  }

  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'List subscriptions (clients: own company only)' })
  findAll(@Query() query: ListSubscriptionsQueryDto, @CurrentUser() user: AuthUser) {
    return this.subscriptions.findAll(query, user);
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get a subscription with payment history' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.subscriptions.findOne(id, user);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a subscription for a company' })
  create(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptions.create(dto);
  }

  @Patch(':id/plan')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Change the subscription plan' })
  changePlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangePlanDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.subscriptions.changePlan(id, dto, user);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiQuery({ name: 'immediate', required: false, type: Boolean })
  @ApiOperation({ summary: 'Cancel a subscription (at period end, or immediately for admins)' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
    @Query('immediate', new ParseBoolPipe({ optional: true })) immediate?: boolean,
  ) {
    return this.subscriptions.cancel(id, user, immediate ?? false);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Undo a pending cancellation' })
  resume(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.subscriptions.resume(id, user);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { ListPaymentsQueryDto, RecordPaymentDto, RefundPaymentDto } from './dto/payments.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Payments')
@ApiBearerAuth('access-token')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  @ApiOperation({ summary: 'Payment history (clients: own company only)' })
  findAll(@Query() query: ListPaymentsQueryDto, @CurrentUser() user: AuthUser) {
    return this.payments.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment with refunds' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.payments.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Record an offline payment' })
  record(@Body() dto: RecordPaymentDto, @CurrentUser() user: AuthUser) {
    return this.payments.record(dto, user);
  }

  @Post(':id/refund')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Refund a payment (full or partial)' })
  refund(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefundPaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.payments.refund(id, dto, user);
  }
}

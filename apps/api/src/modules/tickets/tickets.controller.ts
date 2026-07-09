import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
  ListTicketsQueryDto,
  UpdateTicketDto,
} from './dto/tickets.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Support tickets')
@ApiBearerAuth('access-token')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List ticket categories' })
  categories() {
    return this.tickets.listCategories();
  }

  @Get()
  @ApiOperation({ summary: 'List tickets (clients: own tickets only)' })
  findAll(@Query() query: ListTicketsQueryDto, @CurrentUser() user: AuthUser) {
    return this.tickets.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ticket with its conversation' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.tickets.findOne(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Open a support ticket' })
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthUser) {
    return this.tickets.create(dto, user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DEVELOPER)
  @ApiOperation({ summary: 'Update ticket status, priority, category, or assignee' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tickets.update(id, dto, user);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Reply on a ticket (staff can add internal notes)' })
  addMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTicketMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.tickets.addMessage(id, dto, user);
  }
}

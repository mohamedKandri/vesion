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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, ListInvoicesQueryDto, UpdateInvoiceDto } from './dto/invoices.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Invoices')
@ApiBearerAuth('access-token')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List invoices (clients: own company, non-draft only)' })
  findAll(@Query() query: ListInvoicesQueryDto, @CurrentUser() user: AuthUser) {
    return this.invoices.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice with items and payments' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.invoices.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a draft invoice' })
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoices.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a draft invoice' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoices.update(id, dto);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Issue (send) an invoice to the client' })
  send(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.send(id);
  }

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Void an invoice' })
  voidInvoice(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.voidInvoice(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a draft invoice' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoices.remove(id);
  }
}

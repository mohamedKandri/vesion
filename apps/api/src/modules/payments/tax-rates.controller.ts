import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BillingCatalogService } from './billing-catalog.service';
import { CreateTaxRateDto } from './dto/payments.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Billing catalog')
@ApiBearerAuth('access-token')
@Controller('tax-rates')
export class TaxRatesController {
  constructor(private readonly catalog: BillingCatalogService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List active tax rates' })
  list() {
    return this.catalog.listTaxRates();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a tax rate' })
  create(@Body() dto: CreateTaxRateDto) {
    return this.catalog.createTaxRate(dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deactivate a tax rate' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.catalog.deactivateTaxRate(id);
  }
}

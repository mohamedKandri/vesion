import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { BillingCatalogService } from './billing-catalog.service';
import { CreateDiscountCodeDto, UpdateDiscountCodeDto } from './dto/payments.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Billing catalog')
@ApiBearerAuth('access-token')
@Controller('discount-codes')
export class DiscountCodesController {
  constructor(private readonly catalog: BillingCatalogService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List discount codes' })
  list() {
    return this.catalog.listDiscountCodes();
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a discount code' })
  create(@Body() dto: CreateDiscountCodeDto) {
    return this.catalog.createDiscountCode(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a discount code' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDiscountCodeDto) {
    return this.catalog.updateDiscountCode(id, dto);
  }
}

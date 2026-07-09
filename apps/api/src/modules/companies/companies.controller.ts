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
import { CompaniesService } from './companies.service';
import { CreateCompanyDto, ListCompaniesQueryDto, UpdateCompanyDto } from './dto/companies.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Companies')
@ApiBearerAuth('access-token')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List client companies' })
  findAll(@Query() query: ListCompaniesQueryDto) {
    return this.companies.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a company (clients: own company only)' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.companies.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a company' })
  create(@Body() dto: CreateCompanyDto) {
    return this.companies.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a company (clients: own company only)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.companies.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a company' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.companies.remove(id);
  }
}

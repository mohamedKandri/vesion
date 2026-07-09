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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ContractsService } from './contracts.service';
import { CreateContractDto, SignContractDto } from './dto/contracts.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Contracts')
@ApiBearerAuth('access-token')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get()
  @ApiQuery({ name: 'companyId', required: false })
  @ApiOperation({ summary: 'List contracts (clients: own company, non-draft)' })
  findAll(@CurrentUser() user: AuthUser, @Query('companyId') companyId?: string) {
    return this.contracts.findAll(user, companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a contract' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.contracts.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a draft contract' })
  create(@Body() dto: CreateContractDto) {
    return this.contracts.create(dto);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Send a contract for signature' })
  send(@Param('id', ParseUUIDPipe) id: string) {
    return this.contracts.send(id);
  }

  @Post(':id/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign a contract (client)' })
  sign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SignContractDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.contracts.sign(id, dto, user);
  }

  @Post(':id/terminate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Terminate a contract' })
  terminate(@Param('id', ParseUUIDPipe) id: string) {
    return this.contracts.terminate(id);
  }
}

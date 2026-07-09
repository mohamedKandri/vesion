import {
  Body,
  Controller,
  Delete,
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
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, ListQuotesQueryDto } from './dto/quotes.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/types/auth-user';

@ApiTags('Quotes')
@ApiBearerAuth('access-token')
@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Get()
  @ApiOperation({ summary: 'List quotes (clients: own company, non-draft only)' })
  findAll(@Query() query: ListQuotesQueryDto, @CurrentUser() user: AuthUser) {
    return this.quotes.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a quote with items' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.quotes.findOne(id, user);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a draft quote' })
  create(@Body() dto: CreateQuoteDto) {
    return this.quotes.create(dto);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Send a quote to the client' })
  send(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotes.send(id);
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a quote (client)' })
  accept(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.quotes.respond(id, true, user);
  }

  @Post(':id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a quote (client)' })
  decline(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.quotes.respond(id, false, user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a draft quote' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotes.remove(id);
  }
}

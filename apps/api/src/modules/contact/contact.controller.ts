import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { ContactService } from './contact.service';
import {
  CreateContactSubmissionDto,
  ListSubmissionsQueryDto,
  SubscribeNewsletterDto,
  UpdateSubmissionStatusDto,
} from './dto/contact.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post()
  @ApiOperation({ summary: 'Submit the contact form' })
  submit(@Body() dto: CreateContactSubmissionDto) {
    return this.contact.submit(dto);
  }

  @Get('submissions')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List contact submissions (CRM inbox)' })
  list(@Query() query: ListSubmissionsQueryDto) {
    return this.contact.list(query);
  }

  @Patch('submissions/:id/status')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a submission status' })
  updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSubmissionStatusDto) {
    return this.contact.updateStatus(id, dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('newsletter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to the newsletter' })
  subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.contact.subscribeNewsletter(dto);
  }

  @Public()
  @Post('newsletter/unsubscribe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unsubscribe from the newsletter' })
  unsubscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.contact.unsubscribeNewsletter(dto.email);
  }
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { CareersService } from './careers.service';
import { ApplyDto, CreateJobPostingDto, UpdateApplicationStatusDto } from './dto/careers.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Careers')
@Controller('careers')
export class CareersController {
  constructor(private readonly careers: CareersService) {}

  @Public()
  @Get('postings')
  @ApiOperation({ summary: 'List open job postings' })
  listOpen() {
    return this.careers.listOpenPostings();
  }

  @Get('postings/all')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all postings with application counts' })
  listAll() {
    return this.careers.listAllPostings();
  }

  @Public()
  @Get('postings/:slug')
  @ApiOperation({ summary: 'Get a job posting' })
  findBySlug(@Param('slug') slug: string) {
    return this.careers.findBySlug(slug);
  }

  @Post('postings')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a job posting' })
  create(@Body() dto: CreateJobPostingDto) {
    return this.careers.createPosting(dto);
  }

  @Patch('postings/:id')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update a job posting' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateJobPostingDto) {
    return this.careers.updatePosting(id, dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  @Post('postings/:slug/apply')
  @ApiOperation({ summary: 'Apply to a job posting' })
  apply(@Param('slug') slug: string, @Body() dto: ApplyDto) {
    return this.careers.apply(slug, dto);
  }

  @Get('applications')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiQuery({ name: 'postingId', required: false })
  @ApiOperation({ summary: 'List applications' })
  applications(@Query('postingId') postingId?: string) {
    return this.careers.listApplications(postingId);
  }

  @Patch('applications/:id/status')
  @ApiBearerAuth('access-token')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update application status' })
  updateApplication(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateApplicationStatusDto) {
    return this.careers.updateApplicationStatus(id, dto);
  }
}

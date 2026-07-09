import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuditService, ListAuditQueryDto } from './audit.service';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Audit')
@ApiBearerAuth('access-token')
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Browse the audit trail (admin only)' })
  findAll(@Query() query: ListAuditQueryDto) {
    return this.audit.findAll(query);
  }
}

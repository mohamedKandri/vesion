import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PrismaService } from '../../database/prisma.service';
import { paginated } from '../../common/utils/pagination';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ListAuditQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'invoice.post' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  action?: string;

  @ApiPropertyOptional({ example: 'projects' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  entityType?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListAuditQueryDto) {
    const where: Prisma.AuditLogWhereInput = {
      userId: query.userId,
      entityType: query.entityType,
      ...(query.action ? { action: { contains: query.action, mode: 'insensitive' } } : {}),
      ...(query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: 'insensitive' } },
              { entityType: { contains: query.search, mode: 'insensitive' } },
              { entityId: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }
}

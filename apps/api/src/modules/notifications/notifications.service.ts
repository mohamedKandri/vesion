import { Injectable, Logger } from '@nestjs/common';
import { NotificationType, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { paginated } from '../../common/utils/pagination';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export interface NotificationInput {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async notifyUser(userId: string, input: NotificationInput): Promise<void> {
    try {
      await this.prisma.notification.create({ data: { userId, ...input } });
    } catch (err) {
      this.logger.warn(`Notification failed for user ${userId}: ${(err as Error).message}`);
    }
  }

  /** Notifies every active user belonging to a client company. */
  async notifyCompany(companyId: string, input: NotificationInput): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { companyId, isActive: true },
      select: { id: true },
    });
    if (users.length === 0) return;
    await this.prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, ...input })),
    });
  }

  /** Notifies all staff with the given roles (defaults to admins and managers). */
  async notifyStaff(
    input: NotificationInput,
    roles: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER],
  ): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { role: { in: roles }, isActive: true },
      select: { id: true },
    });
    if (users.length === 0) return;
    await this.prisma.notification.createMany({
      data: users.map((u) => ({ userId: u.id, ...input })),
    });
  }

  async listForUser(userId: string, query: PaginationQueryDto) {
    const where = { userId };
    const [items, total, unread] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { ...paginated(items, query.page, query.limit, total), unread };
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({ where: { userId, readAt: null } });
    return { count };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { message: 'Notification marked as read' };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { message: 'All notifications marked as read' };
  }
}

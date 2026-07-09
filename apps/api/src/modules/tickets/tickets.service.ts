import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType, Prisma, TicketStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../../infrastructure/mail/mail.service';
import { paginated, safeSort } from '../../common/utils/pagination';
import type { AuthUser } from '../../common/types/auth-user';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
  ListTicketsQueryDto,
  UpdateTicketDto,
} from './dto/tickets.dto';

const SORTABLE = ['createdAt', 'updatedAt', 'priority', 'status', 'number'] as const;

const TICKET_INCLUDE = {
  category: true,
  requester: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
  assignee: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
  company: { select: { id: true, name: true } },
  _count: { select: { messages: true, files: true } },
} satisfies Prisma.TicketInclude;

function isStaff(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.MANAGER || role === UserRole.DEVELOPER;
}

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  listCategories() {
    return this.prisma.ticketCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findAll(query: ListTicketsQueryDto, actor: AuthUser) {
    const where: Prisma.TicketWhereInput = {
      status: query.status,
      priority: query.priority,
      categoryId: query.categoryId,
      assigneeId: query.assigneeId,
      ...(isStaff(actor.role)
        ? { companyId: query.companyId }
        : { requesterId: actor.id }),
      ...(query.search
        ? {
            OR: [
              { subject: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
        where,
        include: TICKET_INCLUDE,
        orderBy: safeSort(query.sortBy, SORTABLE, 'updatedAt', query.sortOrder),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  async findOne(id: string, actor: AuthUser) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        ...TICKET_INCLUDE,
        messages: {
          // Clients never see internal notes.
          where: isStaff(actor.role) ? {} : { isInternal: false },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        files: true,
      },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!isStaff(actor.role) && ticket.requesterId !== actor.id) {
      throw new ForbiddenException('You do not have access to this ticket');
    }
    return ticket;
  }

  async create(dto: CreateTicketDto, actor: AuthUser) {
    const ticket = await this.prisma.ticket.create({
      data: {
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority,
        categoryId: dto.categoryId,
        requesterId: actor.id,
        companyId: actor.companyId,
      },
      include: TICKET_INCLUDE,
    });

    await this.notifications.notifyStaff({
      type: NotificationType.TICKET,
      title: `New ${ticket.priority.toLowerCase()} priority ticket #${ticket.number}`,
      body: ticket.subject,
      link: `/admin/support/${ticket.id}`,
    });
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto, actor: AuthUser) {
    const existing = await this.findOne(id, actor);
    const closingNow =
      (dto.status === TicketStatus.CLOSED || dto.status === TicketStatus.RESOLVED) &&
      existing.status !== dto.status;

    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { ...dto, closedAt: dto.status === TicketStatus.CLOSED ? new Date() : undefined },
      include: TICKET_INCLUDE,
    });

    if (closingNow) {
      await this.notifications.notifyUser(ticket.requesterId, {
        type: NotificationType.TICKET,
        title: `Ticket #${ticket.number} ${dto.status === TicketStatus.CLOSED ? 'closed' : 'resolved'}`,
        body: ticket.subject,
        link: `/dashboard/support/${ticket.id}`,
      });
    }
    return ticket;
  }

  async addMessage(id: string, dto: CreateTicketMessageDto, actor: AuthUser) {
    const ticket = await this.findOne(id, actor);
    const internal = isStaff(actor.role) && (dto.isInternal ?? false);

    const message = await this.prisma.ticketMessage.create({
      data: { ticketId: id, authorId: actor.id, body: dto.body, isInternal: internal },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, role: true } },
      },
    });

    // A staff reply reopens the conversation for the client and vice versa.
    const nextStatus = isStaff(actor.role)
      ? TicketStatus.WAITING_ON_CLIENT
      : TicketStatus.IN_PROGRESS;
    if (!internal && ticket.status !== TicketStatus.CLOSED) {
      await this.prisma.ticket.update({ where: { id }, data: { status: nextStatus } });
    }

    if (!internal) {
      if (isStaff(actor.role)) {
        await this.notifications.notifyUser(ticket.requesterId, {
          type: NotificationType.TICKET,
          title: `Reply on ticket #${ticket.number}`,
          body: dto.body.slice(0, 140),
          link: `/dashboard/support/${id}`,
        });
        await this.mail.send({
          to: ticket.requester.email,
          subject: `[Vesion Support] Re: ${ticket.subject} (#${ticket.number})`,
          heading: `New reply on your ticket #${ticket.number}`,
          bodyLines: [dto.body.slice(0, 500), 'Reply from your dashboard to continue the conversation.'],
          cta: {
            label: 'View ticket',
            url: `${process.env.WEB_URL ?? 'http://localhost:3000'}/dashboard/support/${id}`,
          },
        });
      } else if (ticket.assigneeId) {
        await this.notifications.notifyUser(ticket.assigneeId, {
          type: NotificationType.TICKET,
          title: `Client replied on ticket #${ticket.number}`,
          body: dto.body.slice(0, 140),
          link: `/admin/support/${id}`,
        });
      }
    }
    return message;
  }

  /** Auto-close tickets that stayed resolved for the configured number of days. */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async autoCloseResolved() {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'support.autoCloseResolvedAfterDays' },
    });
    const days = typeof setting?.value === 'number' ? setting.value : 7;
    const cutoff = new Date(Date.now() - days * 86_400_000);

    await this.prisma.ticket.updateMany({
      where: { status: TicketStatus.RESOLVED, updatedAt: { lt: cutoff } },
      data: { status: TicketStatus.CLOSED, closedAt: new Date() },
    });
  }
}

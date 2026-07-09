import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { paginated } from '../../common/utils/pagination';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateContactSubmissionDto,
  ListSubmissionsQueryDto,
  SubscribeNewsletterDto,
  UpdateSubmissionStatusDto,
} from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async submit(dto: CreateContactSubmissionDto) {
    const submission = await this.prisma.contactSubmission.create({
      data: { ...dto, email: dto.email.toLowerCase() },
    });

    await this.notifications.notifyStaff({
      type: NotificationType.SYSTEM,
      title: 'New contact enquiry',
      body: `${dto.name}${dto.company ? ` (${dto.company})` : ''} — ${dto.service ?? 'General enquiry'}`,
      link: '/admin/crm',
    });
    return {
      message: 'Thanks for reaching out. Our team will respond within one business day.',
      id: submission.id,
    };
  }

  async list(query: ListSubmissionsQueryDto) {
    const where: Prisma.ContactSubmissionWhereInput = {
      status: query.status,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { company: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contactSubmission.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.contactSubmission.count({ where }),
    ]);
    return paginated(items, query.page, query.limit, total);
  }

  async updateStatus(id: string, dto: UpdateSubmissionStatusDto) {
    const existing = await this.prisma.contactSubmission.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Submission not found');
    return this.prisma.contactSubmission.update({ where: { id }, data: { status: dto.status } });
  }

  async subscribeNewsletter(dto: SubscribeNewsletterDto) {
    await this.prisma.newsletterSubscriber.upsert({
      where: { email: dto.email.toLowerCase() },
      update: { unsubscribedAt: null, confirmedAt: new Date() },
      create: { email: dto.email.toLowerCase(), confirmedAt: new Date() },
    });
    return { message: 'You are subscribed. Welcome aboard!' };
  }

  async unsubscribeNewsletter(email: string) {
    await this.prisma.newsletterSubscriber.updateMany({
      where: { email: email.toLowerCase() },
      data: { unsubscribedAt: new Date() },
    });
    return { message: 'You have been unsubscribed.' };
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationType, Prisma, QuoteStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { paginated } from '../../common/utils/pagination';
import type { AuthUser } from '../../common/types/auth-user';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateQuoteDto, ListQuotesQueryDto } from './dto/quotes.dto';

const QUOTE_INCLUDE = {
  company: { select: { id: true, name: true } },
  taxRate: true,
  items: true,
} satisfies Prisma.QuoteInclude;

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: ListQuotesQueryDto, actor: AuthUser) {
    const isStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER;
    const where: Prisma.QuoteWhereInput = {
      companyId: isStaff ? query.companyId : actor.companyId ?? '__none__',
      ...(isStaff ? { status: query.status } : { status: query.status ?? { not: QuoteStatus.DRAFT } }),
      ...(query.search ? { number: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quote.findMany({
        where,
        include: QUOTE_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.quote.count({ where }),
    ]);
    return paginated(items, query.page, query.limit, total);
  }

  async findOne(id: string, actor: AuthUser) {
    const quote = await this.prisma.quote.findUnique({ where: { id }, include: QUOTE_INCLUDE });
    if (!quote) throw new NotFoundException('Quote not found');
    const isStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER;
    if (!isStaff && (quote.companyId !== actor.companyId || quote.status === QuoteStatus.DRAFT)) {
      throw new ForbiddenException('You do not have access to this quote');
    }
    return quote;
  }

  async create(dto: CreateQuoteDto) {
    const subtotal = round2(dto.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));
    const discountAmount = round2(Math.min(dto.discountAmount ?? 0, subtotal));

    let taxAmount = 0;
    if (dto.taxRateId) {
      const rate = await this.prisma.taxRate.findUnique({ where: { id: dto.taxRateId } });
      if (!rate) throw new BadRequestException('Tax rate not found');
      taxAmount = round2(((subtotal - discountAmount) * Number(rate.ratePercent)) / 100);
    }

    const year = new Date().getFullYear();
    const count = await this.prisma.quote.count({ where: { number: { startsWith: `QTE-${year}-` } } });

    return this.prisma.quote.create({
      data: {
        number: `QTE-${year}-${String(count + 1).padStart(4, '0')}`,
        companyId: dto.companyId,
        validUntil: new Date(dto.validUntil),
        taxRateId: dto.taxRateId,
        notes: dto.notes,
        subtotal,
        discountAmount,
        taxAmount,
        total: round2(subtotal - discountAmount + taxAmount),
        items: {
          create: dto.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: round2(item.quantity * item.unitPrice),
          })),
        },
      },
      include: QUOTE_INCLUDE,
    });
  }

  async send(id: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== QuoteStatus.DRAFT) throw new BadRequestException('Quote already sent');

    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.SENT },
      include: QUOTE_INCLUDE,
    });
    await this.notifications.notifyCompany(updated.companyId, {
      type: NotificationType.INVOICE,
      title: `Quote ${updated.number} is ready for review`,
      body: `Total: ${updated.currency} ${Number(updated.total).toFixed(2)} — valid until ${updated.validUntil.toDateString()}`,
      link: `/dashboard/quotes/${updated.id}`,
    });
    return updated;
  }

  /** Client accepts or declines a sent quote. */
  async respond(id: string, accept: boolean, actor: AuthUser) {
    const quote = await this.findOne(id, actor);
    if (quote.status !== QuoteStatus.SENT) {
      throw new BadRequestException('Only sent quotes can be accepted or declined');
    }
    if (quote.validUntil < new Date()) throw new BadRequestException('This quote has expired');

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        status: accept ? QuoteStatus.ACCEPTED : QuoteStatus.DECLINED,
        respondedAt: new Date(),
      },
      include: QUOTE_INCLUDE,
    });

    await this.notifications.notifyStaff({
      type: NotificationType.INVOICE,
      title: `Quote ${updated.number} ${accept ? 'accepted' : 'declined'}`,
      body: `${updated.company.name} has ${accept ? 'accepted' : 'declined'} the quote.`,
      link: `/admin/quotes/${updated.id}`,
    });
    return updated;
  }

  async remove(id: string) {
    const quote = await this.prisma.quote.findUnique({ where: { id } });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.status !== QuoteStatus.DRAFT) throw new BadRequestException('Only drafts can be deleted');
    await this.prisma.quote.delete({ where: { id } });
    return { message: 'Quote deleted' };
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async expireQuotes() {
    await this.prisma.quote.updateMany({
      where: { status: QuoteStatus.SENT, validUntil: { lt: new Date() } },
      data: { status: QuoteStatus.EXPIRED },
    });
  }
}

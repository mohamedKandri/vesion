import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DiscountType, InvoiceStatus, NotificationType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { paginated, safeSort } from '../../common/utils/pagination';
import type { AuthUser } from '../../common/types/auth-user';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateInvoiceDto, InvoiceItemDto, ListInvoicesQueryDto, UpdateInvoiceDto } from './dto/invoices.dto';

const SORTABLE = ['createdAt', 'issueDate', 'dueDate', 'total', 'status', 'number'] as const;

const INVOICE_INCLUDE = {
  company: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
  taxRate: true,
  discountCode: { select: { id: true, code: true, type: true, value: true } },
  items: true,
  payments: { orderBy: { paidAt: 'desc' as const } },
} satisfies Prisma.InvoiceInclude;

interface Totals {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: ListInvoicesQueryDto, actor: AuthUser) {
    const isStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER;
    const where: Prisma.InvoiceWhereInput = {
      status: query.status,
      projectId: query.projectId,
      companyId: isStaff ? query.companyId : actor.companyId ?? '__none__',
      // Clients never see drafts.
      ...(isStaff ? {} : { status: query.status ?? { not: InvoiceStatus.DRAFT } }),
      ...(query.search ? { number: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({
        where,
        include: INVOICE_INCLUDE,
        orderBy: safeSort(query.sortBy, SORTABLE, 'createdAt', query.sortOrder),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  async findOne(id: string, actor: AuthUser) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: INVOICE_INCLUDE });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const isStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER;
    if (!isStaff && (invoice.companyId !== actor.companyId || invoice.status === InvoiceStatus.DRAFT)) {
      throw new ForbiddenException('You do not have access to this invoice');
    }
    return invoice;
  }

  async create(dto: CreateInvoiceDto) {
    const { discountCodeId, totals } = await this.computeTotals(dto.items, dto.taxRateId, dto.discountCode);
    const number = await this.nextNumber();

    return this.prisma.invoice.create({
      data: {
        number,
        companyId: dto.companyId,
        projectId: dto.projectId,
        dueDate: new Date(dto.dueDate),
        taxRateId: dto.taxRateId,
        discountCodeId,
        notes: dto.notes,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        items: {
          create: dto.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: round2(item.quantity * item.unitPrice),
          })),
        },
      },
      include: INVOICE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: { items: true } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be edited');
    }

    const items: InvoiceItemDto[] =
      dto.items ??
      invoice.items.map((i) => ({
        description: i.description,
        quantity: Number(i.quantity),
        unitPrice: Number(i.unitPrice),
      }));
    const taxRateId = dto.taxRateId ?? invoice.taxRateId ?? undefined;
    const { discountCodeId, totals } = await this.computeTotals(items, taxRateId, dto.discountCode);

    return this.prisma.invoice.update({
      where: { id },
      data: {
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        taxRateId,
        discountCodeId: dto.discountCode !== undefined ? discountCodeId : undefined,
        notes: dto.notes,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        ...(dto.items
          ? {
              items: {
                deleteMany: {},
                create: dto.items.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  amount: round2(item.quantity * item.unitPrice),
                })),
              },
            }
          : {}),
      },
      include: INVOICE_INCLUDE,
    });
  }

  /** Transitions DRAFT → SENT and notifies the client company. */
  async send(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Invoice has already been sent');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.SENT, sentAt: new Date() },
      include: INVOICE_INCLUDE,
    });

    await this.notifications.notifyCompany(updated.companyId, {
      type: NotificationType.INVOICE,
      title: `Invoice ${updated.number} issued`,
      body: `Amount due: ${updated.currency} ${Number(updated.total).toFixed(2)} by ${updated.dueDate.toDateString()}`,
      link: `/dashboard/invoices/${updated.id}`,
    });
    return updated;
  }

  async voidInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('A paid invoice cannot be voided; issue a refund instead');
    }
    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.VOID },
      include: INVOICE_INCLUDE,
    });
  }

  async remove(id: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be deleted');
    }
    await this.prisma.invoice.delete({ where: { id } });
    return { message: 'Invoice deleted' };
  }

  /** Applies a recorded payment to an invoice's balance. Called by PaymentsService. */
  async applyPayment(invoiceId: string, amount: number) {
    const invoice = await this.prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
    const amountPaid = round2(Number(invoice.amountPaid) + amount);
    const paid = amountPaid >= Number(invoice.total) - 0.001;

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid,
        status: paid ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
        paidAt: paid ? new Date() : null,
      },
    });
  }

  /** Nightly job: flag unpaid invoices past their due date. */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async markOverdue() {
    await this.prisma.invoice.updateMany({
      where: {
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
        dueDate: { lt: new Date() },
      },
      data: { status: InvoiceStatus.OVERDUE },
    });
  }

  // ── Internals ───────────────────────────────────────────────

  private async computeTotals(
    items: InvoiceItemDto[],
    taxRateId?: string,
    discountCode?: string,
  ): Promise<{ discountCodeId?: string; totals: Totals }> {
    const subtotal = round2(items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0));

    let discountAmount = 0;
    let discountCodeId: string | undefined;
    if (discountCode) {
      const code = await this.prisma.discountCode.findUnique({ where: { code: discountCode } });
      const usable =
        code &&
        code.isActive &&
        (!code.expiresAt || code.expiresAt > new Date()) &&
        (code.maxRedemptions === null || code.redeemedCount < code.maxRedemptions);
      if (!usable) throw new BadRequestException('Discount code is invalid or expired');
      discountCodeId = code.id;
      discountAmount =
        code.type === DiscountType.PERCENTAGE
          ? round2((subtotal * Number(code.value)) / 100)
          : round2(Math.min(Number(code.value), subtotal));
      await this.prisma.discountCode.update({
        where: { id: code.id },
        data: { redeemedCount: { increment: 1 } },
      });
    }

    let taxAmount = 0;
    if (taxRateId) {
      const rate = await this.prisma.taxRate.findUnique({ where: { id: taxRateId } });
      if (!rate) throw new BadRequestException('Tax rate not found');
      taxAmount = round2(((subtotal - discountAmount) * Number(rate.ratePercent)) / 100);
    }

    return {
      discountCodeId,
      totals: {
        subtotal,
        discountAmount,
        taxAmount,
        total: round2(subtotal - discountAmount + taxAmount),
      },
    };
  }

  private async nextNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.invoice.count({
      where: { number: { startsWith: `INV-${year}-` } },
    });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}

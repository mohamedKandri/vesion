import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, PaymentStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { paginated, safeSort } from '../../common/utils/pagination';
import type { AuthUser } from '../../common/types/auth-user';
import { InvoicesService } from '../invoices/invoices.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ListPaymentsQueryDto, RecordPaymentDto, RefundPaymentDto } from './dto/payments.dto';

const SORTABLE = ['paidAt', 'amount', 'status', 'createdAt'] as const;

const PAYMENT_INCLUDE = {
  company: { select: { id: true, name: true } },
  invoice: { select: { id: true, number: true, total: true } },
  subscription: { select: { id: true, plan: { select: { name: true } } } },
  recordedBy: { select: { id: true, firstName: true, lastName: true } },
  refunds: true,
} satisfies Prisma.PaymentInclude;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoices: InvoicesService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(query: ListPaymentsQueryDto, actor: AuthUser) {
    const isStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER;
    const where: Prisma.PaymentWhereInput = {
      status: query.status,
      invoiceId: query.invoiceId,
      companyId: isStaff ? query.companyId : actor.companyId ?? '__none__',
      ...(query.search ? { reference: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: PAYMENT_INCLUDE,
        orderBy: safeSort(query.sortBy, SORTABLE, 'paidAt', query.sortOrder),
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  async findOne(id: string, actor: AuthUser) {
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: PAYMENT_INCLUDE });
    if (!payment) throw new NotFoundException('Payment not found');
    const isStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER;
    if (!isStaff && payment.companyId !== actor.companyId) {
      throw new ForbiddenException('You do not have access to this payment');
    }
    return payment;
  }

  /** Records an offline payment (bank transfer, check, …) and settles the invoice balance. */
  async record(dto: RecordPaymentDto, actor: AuthUser) {
    if (dto.invoiceId) {
      const invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId } });
      if (!invoice) throw new NotFoundException('Invoice not found');
      if (invoice.companyId !== dto.companyId) {
        throw new BadRequestException('Invoice does not belong to this company');
      }
      const outstanding = Number(invoice.total) - Number(invoice.amountPaid);
      if (dto.amount > outstanding + 0.001) {
        throw new BadRequestException(
          `Payment exceeds the outstanding balance of ${outstanding.toFixed(2)}`,
        );
      }
    }

    const payment = await this.prisma.payment.create({
      data: {
        companyId: dto.companyId,
        invoiceId: dto.invoiceId,
        subscriptionId: dto.subscriptionId,
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
        notes: dto.notes,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        recordedById: actor.id,
      },
      include: PAYMENT_INCLUDE,
    });

    if (dto.invoiceId) {
      await this.invoices.applyPayment(dto.invoiceId, dto.amount);
    }

    await this.notifications.notifyCompany(dto.companyId, {
      type: NotificationType.PAYMENT,
      title: 'Payment received',
      body: `We recorded your payment of ${payment.currency} ${dto.amount.toFixed(2)}. Thank you!`,
      link: payment.invoiceId ? `/dashboard/invoices/${payment.invoiceId}` : '/dashboard/payments',
    });
    return payment;
  }

  async refund(id: string, dto: RefundPaymentDto, actor: AuthUser) {
    const payment = await this.prisma.payment.findUnique({ where: { id }, include: { refunds: true } });
    if (!payment) throw new NotFoundException('Payment not found');

    const refundedSoFar = payment.refunds.reduce((sum, r) => sum + Number(r.amount), 0);
    if (dto.amount > Number(payment.amount) - refundedSoFar + 0.001) {
      throw new BadRequestException('Refund exceeds the refundable amount');
    }

    const fullyRefunded = refundedSoFar + dto.amount >= Number(payment.amount) - 0.001;
    const [refund] = await this.prisma.$transaction([
      this.prisma.refund.create({
        data: { paymentId: id, amount: dto.amount, reason: dto.reason, processedById: actor.id },
      }),
      this.prisma.payment.update({
        where: { id },
        data: { status: fullyRefunded ? PaymentStatus.REFUNDED : payment.status },
      }),
    ]);

    // Reduce the linked invoice's paid balance so its status reflects reality.
    if (payment.invoiceId) {
      await this.invoices.applyPayment(payment.invoiceId, -dto.amount);
    }
    return refund;
  }
}

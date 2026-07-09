import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  BillingInterval,
  NotificationType,
  Prisma,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { paginated } from '../../common/utils/pagination';
import type { AuthUser } from '../../common/types/auth-user';
import { NotificationsService } from '../notifications/notifications.service';
import { ChangePlanDto, CreateSubscriptionDto, ListSubscriptionsQueryDto } from './dto/subscriptions.dto';

const SUB_INCLUDE = {
  plan: true,
  company: { select: { id: true, name: true } },
} satisfies Prisma.SubscriptionInclude;

function addInterval(from: Date, interval: BillingInterval): Date {
  const next = new Date(from);
  const months = interval === 'MONTHLY' ? 1 : interval === 'QUARTERLY' ? 3 : 12;
  next.setMonth(next.getMonth() + months);
  return next;
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Public pricing catalog for the marketing site. */
  listPlans() {
    return this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
  }

  async findAll(query: ListSubscriptionsQueryDto, actor: AuthUser) {
    const isStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER;
    const where: Prisma.SubscriptionWhereInput = {
      status: query.status,
      companyId: isStaff ? query.companyId : actor.companyId ?? '__none__',
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        include: SUB_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.limit,
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return paginated(items, query.page, query.limit, total);
  }

  async findOne(id: string, actor: AuthUser) {
    const sub = await this.prisma.subscription.findUnique({
      where: { id },
      include: { ...SUB_INCLUDE, payments: { orderBy: { paidAt: 'desc' }, take: 24 } },
    });
    if (!sub) throw new NotFoundException('Subscription not found');
    const isStaff = actor.role === UserRole.ADMIN || actor.role === UserRole.MANAGER;
    if (!isStaff && sub.companyId !== actor.companyId) {
      throw new ForbiddenException('You do not have access to this subscription');
    }
    return sub;
  }

  async create(dto: CreateSubscriptionDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) throw new NotFoundException('Plan not found');

    const existing = await this.prisma.subscription.findFirst({
      where: { companyId: dto.companyId, status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
    });
    if (existing) throw new BadRequestException('Company already has an active subscription');

    const now = new Date();
    const sub = await this.prisma.subscription.create({
      data: {
        companyId: dto.companyId,
        planId: dto.planId,
        currentPeriodStart: now,
        currentPeriodEnd: addInterval(now, plan.interval),
      },
      include: SUB_INCLUDE,
    });

    await this.notifications.notifyCompany(dto.companyId, {
      type: NotificationType.PAYMENT,
      title: `Subscribed to the ${plan.name} plan`,
      body: `Your ${plan.interval.toLowerCase()} subscription is active.`,
      link: '/dashboard/billing',
    });
    return sub;
  }

  async changePlan(id: string, dto: ChangePlanDto, actor: AuthUser) {
    const sub = await this.findOne(id, actor);
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) throw new NotFoundException('Plan not found');
    if (sub.planId === dto.planId) throw new BadRequestException('Already on this plan');

    return this.prisma.subscription.update({
      where: { id },
      data: { planId: dto.planId },
      include: SUB_INCLUDE,
    });
  }

  /** Cancels at period end by default; immediate cancellation is admin-only. */
  async cancel(id: string, actor: AuthUser, immediate = false) {
    const sub = await this.findOne(id, actor);
    if (sub.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription is already cancelled');
    }
    if (immediate && actor.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can cancel immediately');
    }

    return this.prisma.subscription.update({
      where: { id },
      data: immediate
        ? { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date(), cancelAtPeriodEnd: false }
        : { cancelAtPeriodEnd: true },
      include: SUB_INCLUDE,
    });
  }

  async resume(id: string, actor: AuthUser) {
    const sub = await this.findOne(id, actor);
    if (!sub.cancelAtPeriodEnd) throw new BadRequestException('Subscription is not pending cancellation');
    return this.prisma.subscription.update({
      where: { id },
      data: { cancelAtPeriodEnd: false },
      include: SUB_INCLUDE,
    });
  }

  /**
   * Nightly billing job: subscriptions whose period ended either roll over
   * (recurring billing — the new period is expected to be paid offline) or
   * cancel if flagged; unpaid rollovers are marked PAST_DUE after 7 days.
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async rollPeriods() {
    const now = new Date();
    const due = await this.prisma.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] }, currentPeriodEnd: { lt: now } },
      include: { plan: true },
    });

    for (const sub of due) {
      if (sub.cancelAtPeriodEnd) {
        await this.prisma.subscription.update({
          where: { id: sub.id },
          data: { status: SubscriptionStatus.CANCELLED, cancelledAt: now },
        });
        continue;
      }

      const paidThisPeriod = await this.prisma.payment.count({
        where: {
          subscriptionId: sub.id,
          paidAt: { gte: sub.currentPeriodStart },
          status: 'COMPLETED',
        },
      });

      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          currentPeriodStart: sub.currentPeriodEnd,
          currentPeriodEnd: addInterval(sub.currentPeriodEnd, sub.plan.interval),
          status: paidThisPeriod > 0 ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PAST_DUE,
        },
      });
    }
  }
}

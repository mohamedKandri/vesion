import { Injectable } from '@nestjs/common';
import { InvoiceStatus, ProjectStatus, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../infrastructure/redis/cache.service';
import type { AuthUser } from '../../common/types/auth-user';

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  /** Admin dashboard: company-wide KPIs, cached for one minute. */
  adminOverview() {
    return this.cache.remember('analytics:admin-overview', 60, async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const yearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

      const [
        clients,
        activeProjects,
        completedProjects,
        openTickets,
        overdueInvoices,
        outstanding,
        monthRevenue,
        payments,
        projectsByStatus,
        ticketsByStatus,
        recentAudit,
      ] = await Promise.all([
        this.prisma.company.count(),
        this.prisma.project.count({
          where: { status: { in: [ProjectStatus.IN_PROGRESS, ProjectStatus.REVIEW, ProjectStatus.PLANNING] } },
        }),
        this.prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
        this.prisma.ticket.count({
          where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] } },
        }),
        this.prisma.invoice.count({ where: { status: InvoiceStatus.OVERDUE } }),
        this.prisma.invoice.aggregate({
          where: { status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] } },
          _sum: { total: true, amountPaid: true },
        }),
        this.prisma.payment.aggregate({
          where: { status: 'COMPLETED', paidAt: { gte: monthStart } },
          _sum: { amount: true },
        }),
        this.prisma.payment.findMany({
          where: { status: 'COMPLETED', paidAt: { gte: yearAgo } },
          select: { amount: true, paidAt: true },
        }),
        this.prisma.project.groupBy({ by: ['status'], _count: true }),
        this.prisma.ticket.groupBy({ by: ['status'], _count: true }),
        this.prisma.auditLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 15,
          include: { user: { select: { firstName: true, lastName: true } } },
        }),
      ]);

      // Build a continuous 12-month revenue series.
      const revenueByMonth: { month: string; revenue: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        revenueByMonth.push({ month: monthKey(d), revenue: 0 });
      }
      const index = new Map(revenueByMonth.map((r, i) => [r.month, i]));
      for (const p of payments) {
        const key = monthKey(p.paidAt);
        const i = index.get(key);
        if (i !== undefined) revenueByMonth[i].revenue += Number(p.amount);
      }

      return {
        kpis: {
          clients,
          activeProjects,
          completedProjects,
          openTickets,
          overdueInvoices,
          revenueThisMonth: Number(monthRevenue._sum.amount ?? 0),
          outstandingReceivables:
            Number(outstanding._sum.total ?? 0) - Number(outstanding._sum.amountPaid ?? 0),
        },
        revenueByMonth,
        projectsByStatus: projectsByStatus.map((g) => ({ status: g.status, count: g._count })),
        ticketsByStatus: ticketsByStatus.map((g) => ({ status: g.status, count: g._count })),
        recentActivity: recentAudit,
      };
    });
  }

  /** Client dashboard: figures scoped to the caller's company. */
  async clientOverview(actor: AuthUser) {
    const companyId = actor.companyId ?? '__none__';
    const [projects, openInvoices, openTickets, recentNotifications] = await Promise.all([
      this.prisma.project.findMany({
        where: { companyId },
        select: { id: true, name: true, status: true, progress: true, dueDate: true },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      this.prisma.invoice.aggregate({
        where: {
          companyId,
          status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        },
        _sum: { total: true, amountPaid: true },
        _count: true,
      }),
      this.prisma.ticket.count({
        where: { requesterId: actor.id, status: { not: TicketStatus.CLOSED } },
      }),
      this.prisma.notification.findMany({
        where: { userId: actor.id },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    return {
      projects,
      billing: {
        openInvoices: openInvoices._count,
        outstandingAmount:
          Number(openInvoices._sum.total ?? 0) - Number(openInvoices._sum.amountPaid ?? 0),
      },
      openTickets,
      recentNotifications,
    };
  }

  /** Public marketing statistics for the landing page. */
  publicStats() {
    return this.cache.remember('analytics:public-stats', 3600, async () => {
      const [projects, clients, testimonialAgg] = await Promise.all([
        this.prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
        this.prisma.company.count(),
        this.prisma.testimonial.aggregate({ _avg: { rating: true }, _count: true }),
      ]);
      return {
        projectsDelivered: projects,
        clients,
        averageRating: Number((testimonialAgg._avg.rating ?? 5).toFixed(1)),
        reviews: testimonialAgg._count,
      };
    });
  }
}

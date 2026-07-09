import { Injectable } from '@nestjs/common';
import { AiContext, InvoiceStatus, TaskStatus, TicketStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { PortfolioService } from '../portfolio/portfolio.service';
import type { AuthUser } from '../../common/types/auth-user';

export interface AssistantAnswer {
  content: string;
  sources: { type: 'kb' | 'faq'; title: string; slug?: string }[];
}

interface Intent {
  name: string;
  patterns: RegExp[];
  contexts: AiContext[] | 'all';
}

const INTENTS: Intent[] = [
  { name: 'greeting', patterns: [/^(hi|hello|hey|good (morning|afternoon|evening)|greetings)\b/i], contexts: 'all' },
  { name: 'thanks', patterns: [/\b(thanks|thank you|cheers|appreciated?)\b/i], contexts: 'all' },
  { name: 'pricing', patterns: [/\b(price|pricing|cost|how much|rates?|budget|plans?|subscription)\b/i], contexts: 'all' },
  { name: 'services', patterns: [/\b(services?|what (do|can) you (do|build|offer)|capabilit|expertise|technolog(y|ies)|stack)\b/i], contexts: 'all' },
  { name: 'contact', patterns: [/\b(contact|talk to (a )?(human|person|sales)|call|email|reach (you|out)|meeting|schedule)\b/i], contexts: 'all' },
  { name: 'process', patterns: [/\b(process|how (do|does) (you|it) work|methodology|timeline|how long|delivery)\b/i], contexts: 'all' },
  { name: 'careers', patterns: [/\b(job|career|hiring|vacanc|position|work (for|at) (you|vesion))\b/i], contexts: 'all' },
  { name: 'project_status', patterns: [/\b(project|progress|milestone|status|deadline|when.*(done|ready|finish))\b/i], contexts: [AiContext.PROJECT, AiContext.SUPPORT] },
  { name: 'billing_status', patterns: [/\b(invoice|payment|bill|owe|balance|due|receipt)\b/i], contexts: [AiContext.PROJECT, AiContext.SUPPORT] },
  { name: 'support_ticket', patterns: [/\b(ticket|issue|bug|problem|broken|not working|error|help me)\b/i], contexts: [AiContext.SUPPORT, AiContext.PROJECT] },
  { name: 'admin_overview', patterns: [/\b(overview|summary|stats|revenue|how (are|is) (we|business)|dashboard)\b/i], contexts: [AiContext.ADMIN] },
];

/**
 * Fully local assistant engine: intent rules for platform actions and live
 * data, plus knowledge-base and FAQ retrieval for everything else. No
 * external services are contacted.
 */
@Injectable()
export class AssistantEngine {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kb: KnowledgeBaseService,
    private readonly portfolio: PortfolioService,
  ) {}

  async answer(
    message: string,
    context: AiContext,
    user: AuthUser | null,
    projectId?: string,
  ): Promise<AssistantAnswer> {
    const intent = this.detectIntent(message, context);

    switch (intent) {
      case 'greeting':
        return this.greeting(context, user);
      case 'thanks':
        return {
          content: "You're welcome! Is there anything else I can help you with?",
          sources: [],
        };
      case 'pricing':
        return this.pricing();
      case 'services':
        return this.services();
      case 'contact':
        return this.contact(user);
      case 'careers':
        return this.careers();
      case 'project_status':
        if (user) return this.projectStatus(user, projectId);
        break;
      case 'billing_status':
        if (user) return this.billingStatus(user);
        break;
      case 'support_ticket':
        if (user) return this.supportStatus(user);
        break;
      case 'admin_overview':
        if (user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)) {
          return this.adminOverview();
        }
        break;
    }

    return this.retrieve(message);
  }

  private detectIntent(message: string, context: AiContext): string | null {
    for (const intent of INTENTS) {
      const applies = intent.contexts === 'all' || intent.contexts.includes(context);
      if (applies && intent.patterns.some((p) => p.test(message))) return intent.name;
    }
    return null;
  }

  // ── Canned + data-driven answers ─────────────────────────────

  private greeting(context: AiContext, user: AuthUser | null): AssistantAnswer {
    const name = user ? `, ${user.firstName}` : '';
    const lines: Record<AiContext, string> = {
      WEBSITE: `Hi${name}! I'm the Vesion assistant. I can tell you about our services, pricing, process, and past work — or connect you with the team. What would you like to know?`,
      SUPPORT: `Hi${name}! I can help you find answers in our knowledge base, check your tickets, or guide you through the dashboard. How can I help?`,
      PROJECT: `Hi${name}! Ask me about your project's progress, milestones, invoices, or anything from the knowledge base.`,
      ADMIN: `Hello${name}! Ask me for a business overview, or search the knowledge base and internal docs.`,
    };
    return { content: lines[context], sources: [] };
  }

  private async pricing(): Promise<AssistantAnswer> {
    const plans = await this.prisma.plan.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } });
    if (plans.length === 0) {
      return {
        content:
          'Project pricing is scoped individually after a short discovery call. Share your goals through our contact form and we will prepare a detailed quote within a few days.',
        sources: [],
      };
    }
    const lines = plans.map(
      (p) => `• **${p.name}** — $${Number(p.price).toLocaleString()}/${p.interval.toLowerCase()}: ${p.description}`,
    );
    return {
      content: `We offer three ongoing engagement plans:\n\n${lines.join('\n')}\n\nFixed-scope projects are quoted per milestone after discovery. Want me to point you to the contact form for a tailored quote?`,
      sources: [],
    };
  }

  private services(): AssistantAnswer {
    return {
      content:
        'Vesion is a full-service software engineering company. We build:\n\n' +
        '• **Web applications & websites** — Next.js, React, TypeScript\n' +
        '• **Mobile apps** — React Native, Swift, Kotlin\n' +
        '• **Desktop applications** — Electron, Tauri\n' +
        '• **AI & automation solutions** — intelligent workflows and integrations\n' +
        '• **Cloud & DevOps** — Docker, Kubernetes, CI/CD\n' +
        '• **APIs & integrations** — REST and event-driven architectures\n' +
        '• **UI/UX design** — research, prototyping, design systems\n' +
        '• **Cybersecurity consulting** — audits, OWASP reviews, hardening\n\n' +
        'Is there a specific type of project you have in mind?',
      sources: [],
    };
  }

  private contact(user: AuthUser | null): AssistantAnswer {
    const base = user
      ? 'You can message the team directly from **Dashboard → Messages**, or open a ticket under **Support** and we will respond within one business day.'
      : 'The fastest way is our contact form at **/contact** — we respond within one business day. You can also email **hello@vesion.dev**.';
    return { content: base, sources: [] };
  }

  private async careers(): Promise<AssistantAnswer> {
    const postings = await this.prisma.jobPosting.findMany({
      where: { isOpen: true },
      select: { title: true, location: true, type: true },
      take: 10,
    });
    if (postings.length === 0) {
      return {
        content:
          'We have no open positions right now, but we are always happy to hear from great people — check the Careers page and send an open application.',
        sources: [],
      };
    }
    const lines = postings.map((p) => `• ${p.title} — ${p.location} (${p.type.replace('_', ' ').toLowerCase()})`);
    return {
      content: `We are currently hiring:\n\n${lines.join('\n')}\n\nSee full descriptions and apply on the **Careers** page.`,
      sources: [],
    };
  }

  private async projectStatus(user: AuthUser, projectId?: string): Promise<AssistantAnswer> {
    const project = await this.prisma.project.findFirst({
      where: {
        ...(projectId ? { id: projectId } : {}),
        ...(user.companyId ? { companyId: user.companyId } : {}),
      },
      include: {
        milestones: { orderBy: { order: 'asc' } },
        _count: { select: { tasks: { where: { status: TaskStatus.DONE } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (!project) {
      return { content: 'I could not find an active project linked to your account. If you believe this is an error, please contact your delivery manager.', sources: [] };
    }

    const nextMilestone = project.milestones.find((m) => m.status !== 'COMPLETED');
    const due = project.dueDate ? ` The overall target date is ${project.dueDate.toDateString()}.` : '';
    return {
      content:
        `**${project.name}** is currently **${project.status.replace(/_/g, ' ').toLowerCase()}** at **${project.progress}%** completion.` +
        (nextMilestone
          ? ` The next milestone is “${nextMilestone.title}”${nextMilestone.dueDate ? ` due ${nextMilestone.dueDate.toDateString()}` : ''}.`
          : ' All milestones are complete.') +
        due +
        '\n\nYou can see the full board and timeline under **Dashboard → Projects**.',
      sources: [],
    };
  }

  private async billingStatus(user: AuthUser): Promise<AssistantAnswer> {
    if (!user.companyId) {
      return { content: 'Your account is not linked to a company yet, so there are no invoices to show.', sources: [] };
    }
    const open = await this.prisma.invoice.findMany({
      where: {
        companyId: user.companyId,
        status: { in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });
    if (open.length === 0) {
      return { content: 'Good news — you have no outstanding invoices. Your payment history is available under **Dashboard → Billing**.', sources: [] };
    }
    const lines = open.map(
      (i) =>
        `• **${i.number}** — ${i.currency} ${(Number(i.total) - Number(i.amountPaid)).toFixed(2)} outstanding, due ${i.dueDate.toDateString()}${i.status === 'OVERDUE' ? ' ⚠ overdue' : ''}`,
    );
    return {
      content: `You have ${open.length} open invoice${open.length > 1 ? 's' : ''}:\n\n${lines.join('\n')}\n\nFull details and payment instructions are under **Dashboard → Invoices**.`,
      sources: [],
    };
  }

  private async supportStatus(user: AuthUser): Promise<AssistantAnswer> {
    const tickets = await this.prisma.ticket.findMany({
      where: { requesterId: user.id, status: { not: TicketStatus.CLOSED } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });
    const intro =
      tickets.length === 0
        ? 'You have no open tickets. To report an issue, open one under **Support → New ticket** and our team will respond within one business day.'
        : `You have ${tickets.length} open ticket${tickets.length > 1 ? 's' : ''}:\n\n` +
          tickets.map((t) => `• #${t.number} — ${t.subject} (*${t.status.replace(/_/g, ' ').toLowerCase()}*)`).join('\n') +
          '\n\nOpen **Dashboard → Support** to reply or check details.';
    return { content: intro, sources: [] };
  }

  private async adminOverview(): Promise<AssistantAnswer> {
    const [activeProjects, openTickets, overdue, monthRevenue] = await Promise.all([
      this.prisma.project.count({ where: { status: { in: ['IN_PROGRESS', 'REVIEW', 'PLANNING'] } } }),
      this.prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      this.prisma.invoice.count({ where: { status: 'OVERDUE' } }),
      this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paidAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
        _sum: { amount: true },
      }),
    ]);
    return {
      content:
        `Here is the current snapshot:\n\n` +
        `• **Active projects:** ${activeProjects}\n` +
        `• **Open support tickets:** ${openTickets}\n` +
        `• **Overdue invoices:** ${overdue}\n` +
        `• **Revenue this month:** $${Number(monthRevenue._sum.amount ?? 0).toLocaleString()}\n\n` +
        'The full analytics are under **Admin → Analytics**.',
      sources: [],
    };
  }

  /** Retrieval fallback: FAQ + knowledge-base search with cited sources. */
  private async retrieve(message: string): Promise<AssistantAnswer> {
    const [faqs, articles] = await Promise.all([
      this.portfolio.searchFaq(message, 2),
      this.kb.search(message, 3),
    ]);

    if (faqs.length === 0 && articles.length === 0) {
      return {
        content:
          "I don't have a confident answer for that yet. Could you rephrase, or would you like me to point you to our contact form so a human can help? You can also browse the knowledge base for detailed guides.",
        sources: [],
      };
    }

    const parts: string[] = [];
    const sources: AssistantAnswer['sources'] = [];

    if (faqs.length > 0) {
      parts.push(faqs[0].answer);
      for (const f of faqs) sources.push({ type: 'faq', title: f.question });
    }
    if (articles.length > 0) {
      const list = articles.map((a) => `• **${a.title}** — ${a.excerpt}`).join('\n');
      parts.push(`These knowledge-base articles should help:\n\n${list}`);
      for (const a of articles) sources.push({ type: 'kb', title: a.title, slug: a.slug });
    }

    return { content: parts.join('\n\n'), sources };
  }
}

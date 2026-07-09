import { cn, humanize } from '@/lib/utils';

type Tone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

const TONES: Record<Tone, string> = {
  neutral: 'bg-black/5 text-[rgb(var(--muted))] dark:bg-white/10',
  brand: 'bg-brand-500/15 text-brand-500 dark:text-brand-300',
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
  info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, Tone> = {
  // projects
  DISCOVERY: 'info',
  PLANNING: 'info',
  IN_PROGRESS: 'brand',
  REVIEW: 'warning',
  ON_HOLD: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
  // tasks
  BACKLOG: 'neutral',
  TODO: 'info',
  IN_REVIEW: 'warning',
  DONE: 'success',
  // invoices / quotes / contracts
  DRAFT: 'neutral',
  SENT: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'success',
  OVERDUE: 'danger',
  VOID: 'neutral',
  ACCEPTED: 'success',
  DECLINED: 'danger',
  EXPIRED: 'neutral',
  SIGNED: 'success',
  TERMINATED: 'danger',
  // tickets
  OPEN: 'info',
  WAITING_ON_CLIENT: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
  // priority
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
  // subscriptions
  ACTIVE: 'success',
  TRIALING: 'info',
  PAST_DUE: 'danger',
  PAUSED: 'warning',
  // posts
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
  // payments
  PENDING: 'warning',
  FAILED: 'danger',
  REFUNDED: 'neutral',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge tone={STATUS_TONES[status] ?? 'neutral'} className={className}>
      {humanize(status)}
    </Badge>
  );
}

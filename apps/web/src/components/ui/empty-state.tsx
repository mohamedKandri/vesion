import { cn } from '@/lib/utils';

export function EmptyState({
  icon = '◇',
  title,
  description,
  action,
  className,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--card-border))] px-6 py-16 text-center',
        className,
      )}
    >
      <span aria-hidden="true" className="mb-4 text-4xl text-brand-500">
        {icon}
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[rgb(var(--muted))]">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

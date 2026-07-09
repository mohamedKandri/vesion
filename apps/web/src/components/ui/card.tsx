import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card p-6', className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>
      <div>
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-sm text-[rgb(var(--muted))]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

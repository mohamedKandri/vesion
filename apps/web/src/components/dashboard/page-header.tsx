export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-[rgb(var(--muted))]">{description}</p>}
      </div>
      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[rgb(var(--muted))]">{label}</p>
        {icon && (
          <span aria-hidden="true" className="text-lg">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p>}
    </div>
  );
}

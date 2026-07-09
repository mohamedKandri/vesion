'use client';

import { cn } from '@/lib/utils';

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-[rgb(var(--card-border))] bg-black/[0.03] p-1 dark:bg-white/[0.04]',
        className,
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium transition',
            active === tab.id
              ? 'bg-[rgb(var(--card))] shadow-sm'
              : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 rounded-full bg-brand-500/15 px-1.5 text-xs text-brand-500">
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

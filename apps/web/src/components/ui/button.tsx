'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './spinner';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-gradient text-white shadow-glow-sm hover:opacity-90 hover:shadow-glow focus-visible:ring-brand-400',
  secondary:
    'bg-[rgb(var(--foreground))] text-[rgb(var(--background))] hover:opacity-85',
  outline:
    'border border-[rgb(var(--card-border))] bg-transparent hover:bg-black/5 dark:hover:bg-white/5',
  ghost: 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10',
  danger: 'bg-red-600 text-white hover:bg-red-500',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-7 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', loading, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
});

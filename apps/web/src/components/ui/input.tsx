'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
}

const baseFieldClasses =
  'w-full rounded-xl border border-[rgb(var(--card-border))] bg-transparent px-4 py-2.5 text-sm transition placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  function Input({ className, label, error, hint, id, ...props }, ref) {
    const autoId = useId();
    const inputId = id ?? autoId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(baseFieldClasses, error && 'border-red-500 focus:border-red-500 focus:ring-red-500', className)}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p>}
        {error && (
          <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(function Textarea({ className, label, error, hint, id, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn(baseFieldClasses, 'min-h-[120px] resize-y', error && 'border-red-500', className)}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-[rgb(var(--muted))]">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & FieldProps
>(function Select({ className, label, error, id, children, ...props }, ref) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={cn(
          baseFieldClasses,
          'appearance-none bg-[rgb(var(--card))] pr-9',
          error && 'border-red-500',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p role="alert" className="mt-1 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});

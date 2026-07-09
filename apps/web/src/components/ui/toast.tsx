'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (title: string, options?: { description?: string; variant?: ToastVariant }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: 'border-emerald-500/40 [&_[data-dot]]:bg-emerald-400',
  error: 'border-red-500/40 [&_[data-dot]]:bg-red-400',
  info: 'border-brand-500/40 [&_[data-dot]]:bg-brand-400',
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastContextValue['toast']>(
    (title, options) => {
      const id = nextId++;
      setToasts((prev) => [...prev.slice(-4), { id, title, variant: options?.variant ?? 'info', description: options?.description }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast(title, { description, variant: 'success' }),
      error: (title, description) => toast(title, { description, variant: 'error' }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className={cn(
                'pointer-events-auto rounded-xl border bg-[rgb(var(--card))] p-4 shadow-glass',
                VARIANT_STYLES[t.variant],
              )}
              role="status"
            >
              <div className="flex items-start gap-3">
                <span data-dot className="mt-1.5 h-2 w-2 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-sm text-[rgb(var(--muted))]">{t.description}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="text-[rgb(var(--muted))] transition hover:text-[rgb(var(--foreground))]"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

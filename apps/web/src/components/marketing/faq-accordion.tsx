'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { FaqItem } from '@/lib/types';
import { cn } from '@/lib/utils';

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div
            key={item.id}
            className={cn(
              'overflow-hidden rounded-2xl border transition-colors',
              isOpen ? 'border-brand-500/50 bg-[rgb(var(--card))]' : 'border-[rgb(var(--card-border))]',
            )}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
            >
              <span className="font-medium">{item.question}</span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                aria-hidden="true"
                className="shrink-0 text-xl text-brand-500"
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="px-6 pb-5 text-sm leading-relaxed text-[rgb(var(--muted))]">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

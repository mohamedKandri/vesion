'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Scroll-reveal wrapper used across marketing sections. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.65, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'center' | 'left';
  className?: string;
}) {
  return (
    <Reveal className={cn('mb-12', align === 'center' && 'mx-auto max-w-2xl text-center', className)}>
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-500">{eyebrow}</p>
      )}
      <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-lg text-[rgb(var(--muted))]">{description}</p>}
    </Reveal>
  );
}

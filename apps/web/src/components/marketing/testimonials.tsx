'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Avatar } from '@/components/ui/avatar';
import { SectionHeading } from './section';
import type { Testimonial } from '@/lib/types';

export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (testimonials.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 7000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  if (testimonials.length === 0) return null;
  const current = testimonials[index];
  const [firstName, ...rest] = current.authorName.split(' ');

  return (
    <section className="relative overflow-hidden py-24">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-96 w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-600/10 blur-[120px]"
      />
      <div className="container-page relative">
        <SectionHeading eyebrow="Client stories" title="Don't take our word for it" />
        <div className="mx-auto max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.figure
              key={current.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="glass-light rounded-3xl p-8 text-center sm:p-12"
            >
              <div aria-label={`${current.rating} out of 5 stars`} className="mb-6 text-lg text-amber-400">
                {'★'.repeat(current.rating)}
                <span className="text-[rgb(var(--muted))]">{'★'.repeat(5 - current.rating)}</span>
              </div>
              <blockquote className="font-display text-xl font-medium leading-relaxed sm:text-2xl">
                “{current.quote}”
              </blockquote>
              <figcaption className="mt-8 flex items-center justify-center gap-3">
                <Avatar firstName={firstName} lastName={rest.join(' ')} src={current.avatarUrl} />
                <div className="text-left">
                  <p className="text-sm font-semibold">{current.authorName}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    {current.authorRole}, {current.companyName}
                  </p>
                </div>
              </figcaption>
            </motion.figure>
          </AnimatePresence>

          {testimonials.length > 1 && (
            <div role="tablist" aria-label="Testimonials" className="mt-6 flex justify-center gap-2">
              {testimonials.map((t, i) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Testimonial from ${t.authorName}`}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? 'w-8 bg-brand-500' : 'w-2 bg-[rgb(var(--card-border))]'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

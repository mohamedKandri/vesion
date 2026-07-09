'use client';

import { Reveal, SectionHeading } from './section';
import { PROCESS_STEPS } from '@/content/site';

export function Process() {
  return (
    <section className="container-page py-24">
      <SectionHeading
        eyebrow="How we work"
        title="A process built on predictability"
        description="No black boxes. You see progress in your dashboard every day and a working demo every two weeks."
      />
      <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {PROCESS_STEPS.map((step, i) => (
          <Reveal key={step.step} delay={i * 0.1}>
            <li className="relative h-full rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-6">
              <span className="font-display text-5xl font-bold text-gradient opacity-90">
                {step.step}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
                {step.description}
              </p>
              {i < PROCESS_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-2xl text-brand-500/60 lg:block"
                >
                  →
                </span>
              )}
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

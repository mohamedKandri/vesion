'use client';

import Link from 'next/link';
import { Reveal, SectionHeading } from './section';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils';
import type { Plan } from '@/lib/types';

export function PricingSection({ plans, compact = false }: { plans: Plan[]; compact?: boolean }) {
  return (
    <section id="pricing" className="container-page py-24">
      <SectionHeading
        eyebrow="Pricing"
        title="Engagements that scale with you"
        description="Ongoing product plans below — fixed-scope projects are quoted per milestone after a free discovery call."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan, i) => (
          <Reveal key={plan.id} delay={i * 0.1}>
            <div
              className={`relative flex h-full flex-col rounded-3xl border p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.isPopular
                  ? 'border-brand-500 bg-[rgb(var(--card))] shadow-glow-sm'
                  : 'border-[rgb(var(--card-border))] bg-[rgb(var(--card))]'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-gradient px-4 py-1 text-xs font-bold text-white">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-xl font-bold">{plan.name}</h3>
              <p className="mt-2 min-h-[2.5rem] text-sm text-[rgb(var(--muted))]">{plan.description}</p>
              <p className="mt-6">
                <span className="font-display text-4xl font-bold">
                  {formatMoney(plan.price, plan.currency)}
                </span>
                <span className="text-sm text-[rgb(var(--muted))]">
                  {' '}
                  / {plan.interval.toLowerCase().replace('ly', '')}
                </span>
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {(compact ? plan.features.slice(0, 4) : plan.features).map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <span aria-hidden="true" className="mt-0.5 text-brand-500">
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href={`/contact?plan=${plan.slug}`} className="mt-8">
                <Button variant={plan.isPopular ? 'primary' : 'outline'} className="w-full">
                  Get started
                </Button>
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

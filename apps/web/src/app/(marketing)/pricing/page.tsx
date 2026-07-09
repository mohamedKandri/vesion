import type { Metadata } from 'next';
import { serverFetch } from '@/lib/api';
import type { FaqItem, Plan } from '@/lib/types';
import { PricingSection } from '@/components/marketing/pricing-section';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { SectionHeading, Reveal } from '@/components/marketing/section';
import { Cta } from '@/components/marketing/cta';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Transparent pricing for ongoing product engagements, plus milestone-based quotes for fixed-scope projects.',
};

export default async function PricingPage() {
  const [plans, faq] = await Promise.all([
    serverFetch<Plan[]>('/subscriptions/plans', 300),
    serverFetch<FaqItem[]>('/faq', 300),
  ]);

  const pricingFaq = (faq ?? []).filter((f) => ['Pricing', 'Process', 'Legal'].includes(f.category));

  return (
    <>
      {plans && plans.length > 0 && <PricingSection plans={plans} />}

      <section className="container-page pb-24">
        <Reveal>
          <div className="mx-auto max-w-3xl rounded-3xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-8 text-center sm:p-10">
            <h2 className="font-display text-2xl font-bold">Fixed-scope project?</h2>
            <p className="mt-3 text-[rgb(var(--muted))]">
              For defined builds — a website, an app, a platform — we quote per milestone after a
              free discovery call. Every quote itemizes deliverables, timelines, and acceptance
              criteria, so you know exactly what you're paying for. Typical engagements range from
              $15k to $250k.
            </p>
          </div>
        </Reveal>
      </section>

      {pricingFaq.length > 0 && (
        <section className="container-page pb-24">
          <SectionHeading eyebrow="FAQ" title="Pricing questions" />
          <FaqAccordion items={pricingFaq} />
        </section>
      )}

      <Cta />
    </>
  );
}

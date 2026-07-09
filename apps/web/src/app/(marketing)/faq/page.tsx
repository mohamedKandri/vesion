import type { Metadata } from 'next';
import { serverFetch } from '@/lib/api';
import type { FaqItem } from '@/lib/types';
import { SectionHeading } from '@/components/marketing/section';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { Cta } from '@/components/marketing/cta';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Answers about our process, pricing, technology, security, and support.',
};

export default async function FaqPage() {
  const faq = (await serverFetch<FaqItem[]>('/faq', 300)) ?? [];
  const categories = Array.from(new Set(faq.map((f) => f.category)));

  return (
    <>
      <section className="container-page py-24">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently asked questions"
          description="Can't find what you're looking for? Ask the assistant in the corner, or contact us directly."
        />
        {faq.length === 0 ? (
          <EmptyState title="No FAQ published yet" />
        ) : (
          <div className="space-y-14">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="mb-5 text-center font-display text-xl font-bold text-brand-500">
                  {category}
                </h2>
                <FaqAccordion items={faq.filter((f) => f.category === category)} />
              </div>
            ))}
          </div>
        )}
      </section>
      <Cta />
    </>
  );
}

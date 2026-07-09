import type { Metadata } from 'next';
import Link from 'next/link';
import { serverFetch } from '@/lib/api';
import type { FaqItem, Paginated, Plan, PortfolioItem, Testimonial } from '@/lib/types';
import { Hero } from '@/components/marketing/hero';
import { Stats } from '@/components/marketing/stats';
import { BentoGrid } from '@/components/marketing/bento';
import { UniverseSection } from '@/components/marketing/universe-section';
import { PortfolioFlythrough } from '@/components/marketing/portfolio-flythrough';
import { Pipeline } from '@/components/marketing/pipeline';
import { TechOrbs } from '@/components/marketing/tech-orbs';
import { Testimonials } from '@/components/marketing/testimonials';
import { PricingSection } from '@/components/marketing/pricing-section';
import { FaqAccordion } from '@/components/marketing/faq-accordion';
import { Cta } from '@/components/marketing/cta';
import { SectionHeading } from '@/components/marketing/section';

export const metadata: Metadata = {
  title: 'VESION — Engineering Extraordinary Software',
};

export default async function HomePage() {
  const [plans, testimonials, faq, portfolio] = await Promise.all([
    serverFetch<Plan[]>('/subscriptions/plans', 300),
    serverFetch<Testimonial[]>('/testimonials', 300),
    serverFetch<FaqItem[]>('/faq', 300),
    serverFetch<Paginated<PortfolioItem>>('/portfolio?limit=6', 300),
  ]);

  return (
    <>
      <Hero />
      <Stats />
      <BentoGrid />
      <UniverseSection />
      <PortfolioFlythrough items={portfolio?.items ?? []} />
      <Pipeline />
      <TechOrbs />

      {testimonials && testimonials.length > 0 && <Testimonials testimonials={testimonials} />}
      {plans && plans.length > 0 && <PricingSection plans={plans} compact />}

      {faq && faq.length > 0 && (
        <section className="container-page py-24">
          <SectionHeading eyebrow="FAQ" title="Questions, answered" />
          <FaqAccordion items={faq.slice(0, 6)} />
          <p className="mt-8 text-center">
            <Link href="/faq" className="font-semibold text-brand-500 hover:underline">
              See all questions →
            </Link>
          </p>
        </section>
      )}

      <Cta />
    </>
  );
}

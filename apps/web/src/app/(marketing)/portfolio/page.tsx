import type { Metadata } from 'next';
import { serverFetch } from '@/lib/api';
import type { Paginated, PortfolioItem } from '@/lib/types';
import { SectionHeading } from '@/components/marketing/section';
import { PortfolioCard } from '@/components/marketing/portfolio-card';
import { Cta } from '@/components/marketing/cta';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'Selected software projects delivered by VESION across logistics, healthcare, e-commerce, and manufacturing.',
};

export default async function PortfolioPage() {
  const portfolio = await serverFetch<Paginated<PortfolioItem>>('/portfolio?limit=24', 300);
  const items = portfolio?.items ?? [];

  return (
    <>
      <section className="container-page py-24">
        <SectionHeading
          eyebrow="Portfolio"
          title="Work that shipped and stayed shipped"
          description="Every project below is in production today. Case studies include measured business outcomes."
        />
        {items.length === 0 ? (
          <EmptyState
            title="Portfolio is being refreshed"
            description="Check back soon — or ask us directly about relevant past work."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <PortfolioCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
      <Cta />
    </>
  );
}

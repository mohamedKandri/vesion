import type { Metadata } from 'next';
import { serverFetch } from '@/lib/api';
import type { Paginated, PortfolioItem } from '@/lib/types';
import { SectionHeading } from '@/components/marketing/section';
import { PortfolioCard } from '@/components/marketing/portfolio-card';
import { Cta } from '@/components/marketing/cta';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = {
  title: 'Case Studies',
  description: 'In-depth case studies: the challenge, our solution, and the measured business results.',
};

export default async function CaseStudiesPage() {
  const portfolio = await serverFetch<Paginated<PortfolioItem>>(
    '/portfolio?caseStudiesOnly=true&limit=24',
    300,
  );
  const items = portfolio?.items ?? [];

  return (
    <>
      <section className="container-page py-24">
        <SectionHeading
          eyebrow="Case studies"
          title="Problems, solutions, and receipts"
          description="Challenge → solution → measurable results. This is how we evaluate our own work."
        />
        {items.length === 0 ? (
          <EmptyState title="Case studies coming soon" />
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

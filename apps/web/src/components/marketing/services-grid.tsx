'use client';

import Link from 'next/link';
import { Reveal, SectionHeading } from './section';
import { SERVICES } from '@/content/site';

export function ServicesGrid({ limit }: { limit?: number }) {
  const services = limit ? SERVICES.slice(0, limit) : SERVICES;

  return (
    <section id="services" className="container-page py-24">
      <SectionHeading
        eyebrow="What we do"
        title="Every layer of your product, handled"
        description="From the first wireframe to the last deployment script — one senior team, end to end."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => (
          <Reveal key={service.slug} delay={(i % 3) * 0.08}>
            <Link
              href={`/services#${service.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-glow-sm"
            >
              <span aria-hidden="true" className="mb-4 text-3xl">
                {service.icon}
              </span>
              <h3 className="font-display text-lg font-semibold group-hover:text-brand-500">
                {service.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[rgb(var(--muted))]">
                {service.summary}
              </p>
              <span className="mt-4 text-sm font-semibold text-brand-500 opacity-0 transition group-hover:opacity-100">
                Learn more →
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
      {limit && (
        <Reveal className="mt-10 text-center">
          <Link href="/services" className="font-semibold text-brand-500 hover:underline">
            View all services →
          </Link>
        </Reveal>
      )}
    </section>
  );
}

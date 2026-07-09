import type { Metadata } from 'next';
import { SectionHeading, Reveal } from '@/components/marketing/section';
import { AnimatedBackground } from '@/components/marketing/hero';
import { Stats } from '@/components/marketing/stats';
import { Cta } from '@/components/marketing/cta';
import { Avatar } from '@/components/ui/avatar';
import { COMPANY_VALUES, TEAM, SITE } from '@/content/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'VESION is a senior software engineering studio. Meet the team and the principles behind our work.',
};

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden py-24">
        <AnimatedBackground />
        <div className="container-page relative text-center">
          <Reveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-brand-500">
              About VESION
            </p>
            <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
              A small team of senior engineers with
              <span className="text-gradient"> outsized standards</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[rgb(var(--muted))]">
              We started VESION because too much custom software is built to be billed, not to be
              used. We build the opposite: products with clean architecture, honest timelines, and
              craftsmanship in every pixel — software your business runs on for years.
            </p>
          </Reveal>
        </div>
      </section>

      <Stats />

      <section className="container-page py-24">
        <SectionHeading
          eyebrow="Our principles"
          title="What working with us feels like"
        />
        <div className="grid gap-6 md:grid-cols-2">
          {COMPANY_VALUES.map((value, i) => (
            <Reveal key={value.title} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-8">
                <h3 className="font-display text-xl font-semibold text-brand-500">{value.title}</h3>
                <p className="mt-3 leading-relaxed text-[rgb(var(--muted))]">{value.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-page pb-24">
        <SectionHeading
          eyebrow="The team"
          title="The people behind the work"
          description={`We are a remote-first team headquartered in Amsterdam (${SITE.address.split(',').pop()?.trim()}).`}
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM.map((member, i) => {
            const [firstName, ...rest] = member.name.split(' ');
            return (
              <Reveal key={member.name} delay={(i % 3) * 0.08}>
                <div className="flex h-full flex-col rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-6">
                  <Avatar firstName={firstName} lastName={rest.join(' ')} size="lg" />
                  <h3 className="mt-4 font-display text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm font-medium text-brand-500">{member.role}</p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{member.bio}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <Cta />
    </>
  );
}

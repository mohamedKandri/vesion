import type { Metadata } from 'next';
import { SectionHeading, Reveal } from '@/components/marketing/section';
import { Process } from '@/components/marketing/process';
import { TechMarquee } from '@/components/marketing/tech-marquee';
import { Cta } from '@/components/marketing/cta';
import { SERVICES } from '@/content/site';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Custom websites, web & mobile applications, desktop software, AI solutions, cloud, automation, APIs, UI/UX design, and cybersecurity consulting.',
};

export default function ServicesPage() {
  return (
    <>
      <section className="container-page py-24">
        <SectionHeading
          eyebrow="Services"
          title="Ten disciplines. One accountable team."
          description="Whatever the stack, the standard is the same: shipped on time, documented, tested, and secured."
        />

        <div className="space-y-6">
          {SERVICES.map((service, i) => (
            <Reveal key={service.slug} delay={Math.min(i * 0.04, 0.2)}>
              <article
                id={service.slug}
                className="grid scroll-mt-24 gap-8 rounded-3xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-8 lg:grid-cols-2 lg:p-10"
              >
                <div>
                  <span aria-hidden="true" className="text-4xl">
                    {service.icon}
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-bold">{service.title}</h2>
                  <p className="mt-3 leading-relaxed text-[rgb(var(--muted))]">{service.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {service.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-500"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <ul className="space-y-3 self-center">
                  {service.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span aria-hidden="true" className="mt-0.5 text-brand-500">
                        ✓
                      </span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <TechMarquee />
      <Process />
      <Cta />
    </>
  );
}

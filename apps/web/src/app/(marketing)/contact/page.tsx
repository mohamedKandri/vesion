import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SectionHeading } from '@/components/marketing/section';
import { ContactForm } from './contact-form';
import { SITE } from '@/content/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Tell us about your project. We respond within one business day.',
};

const CHANNELS = [
  { icon: '✉️', label: 'Email', value: SITE.email, href: `mailto:${SITE.email}` },
  { icon: '📍', label: 'Office', value: SITE.address },
  { icon: '⏱️', label: 'Response time', value: 'Within one business day' },
];

export default function ContactPage() {
  return (
    <section className="container-page py-24">
      <SectionHeading
        eyebrow="Contact"
        title="Let's build something"
        description="Share a few details and we'll come back with honest feedback, a rough plan, and next steps."
      />

      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          {CHANNELS.map((channel) => (
            <div
              key={channel.label}
              className="flex items-start gap-4 rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-5"
            >
              <span aria-hidden="true" className="text-2xl">
                {channel.icon}
              </span>
              <div>
                <p className="text-sm font-semibold">{channel.label}</p>
                {channel.href ? (
                  <a href={channel.href} className="text-sm text-brand-500 hover:underline">
                    {channel.value}
                  </a>
                ) : (
                  <p className="text-sm text-[rgb(var(--muted))]">{channel.value}</p>
                )}
              </div>
            </div>
          ))}
          <div className="rounded-2xl bg-brand-gradient p-[1px]">
            <div className="rounded-2xl bg-[rgb(var(--card))] p-5">
              <p className="text-sm font-semibold">Prefer to talk first?</p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Mention it in your message and we'll send a calendar link for a free 30-minute
                discovery call — no sales script, just engineers.
              </p>
            </div>
          </div>
        </div>

        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
    </section>
  );
}

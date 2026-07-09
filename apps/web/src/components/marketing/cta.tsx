'use client';

import Link from 'next/link';
import { Reveal } from './section';
import { Button } from '@/components/ui/button';

export function Cta() {
  return (
    <section className="container-page pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-brand-gradient p-10 text-center text-white sm:p-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
          <h2 className="relative font-display text-3xl font-bold sm:text-4xl">
            Have an idea worth building?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/85">
            Tell us about your project. We reply within one business day with honest feedback,
            a rough plan, and next steps — no pressure, no jargon.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-brand-700 shadow-none hover:bg-white/90">
                Start the conversation
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="ghost" className="border border-white/40 text-white hover:bg-white/10">
                View pricing
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

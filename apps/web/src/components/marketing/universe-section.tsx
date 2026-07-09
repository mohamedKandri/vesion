'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { PLANETS } from '@/components/three/universe-scene';
import { cn } from '@/lib/utils';

const UniverseScene = dynamic(() => import('@/components/three/universe-scene'), { ssr: false });

const PLANET_DETAILS: Record<string, { title: string; description: string; href: string }> = {
  web: {
    title: 'Website Planet',
    description:
      'Floating browser worlds: marketing sites, storefronts, and portals with sub-second first paint and SEO built into the architecture.',
    href: '/services#custom-websites',
  },
  mobile: {
    title: 'Mobile Planet',
    description:
      'Native-quality iOS and Android applications from one codebase — offline-first, push-ready, store-submission included.',
    href: '/services#mobile-applications',
  },
  ai: {
    title: 'AI Planet',
    description:
      'Neural particles at work: retrieval assistants, document pipelines, and evaluated machine intelligence grounded in your data.',
    href: '/services#ai-solutions',
  },
  desktop: {
    title: 'Desktop Planet',
    description:
      'Cross-platform desktop software with auto-updates, code signing, and deep OS integration for Windows, macOS, and Linux.',
    href: '/services#desktop-applications',
  },
  cloud: {
    title: 'Cloud Planet',
    description:
      'Servers and containers in perfect orbit: Kubernetes, infrastructure-as-code, and cost audits that cut spend 30–60%.',
    href: '/services#cloud-solutions',
  },
  automation: {
    title: 'Automation Planet',
    description:
      'Connected nodes replacing copy-paste: event-driven workflows between your systems with full audit trails.',
    href: '/services#automation',
  },
};

/**
 * The Software Universe: Vesion's crystal at the center of a digital galaxy.
 * Planets are selectable from the 3D scene or the accessible chip list below.
 */
export function UniverseSection() {
  const [focused, setFocused] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const detail = focused ? PLANET_DETAILS[focused] : null;

  return (
    <section className="relative overflow-hidden bg-[#060916] py-24" aria-label="The Vesion software universe">
      <div className="container-page relative z-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">The universe</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
          One core. <span className="text-gradient-cool">Six worlds.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-white/55">
          Every service is a living part of the Vesion ecosystem. Select a planet to explore it.
        </p>
      </div>

      <div className="relative mx-auto mt-10 h-[70vh] min-h-[480px] max-w-[1600px]">
        {!reducedMotion && (
          <div className="absolute inset-0 hidden sm:block">
            <UniverseScene focused={focused} onSelect={setFocused} />
          </div>
        )}
        {/* Static nebula fallback: always on mobile, everywhere for reduced motion */}
        <div className={cn('nebula absolute inset-0', !reducedMotion && 'sm:hidden')} aria-hidden="true" />


        {/* Focused planet detail — glass HUD */}
        <AnimatePresence>
          {detail && (
            <motion.aside
              key={focused}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.21, 0.65, 0.36, 1] }}
              className="glass absolute bottom-6 left-1/2 z-10 w-[min(480px,calc(100%-2rem))] -translate-x-1/2 rounded-card border-white/10 p-6 text-left"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">{detail.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{detail.description}</p>
                </div>
                <button
                  onClick={() => setFocused(null)}
                  aria-label="Zoom back out"
                  className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60 transition hover:bg-white/10"
                >
                  ← Back
                </button>
              </div>
              <Link
                href={detail.href}
                className="mt-4 inline-block text-sm font-semibold text-brand-400 hover:underline"
              >
                Explore this world →
              </Link>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Accessible planet selector (also the mobile experience) */}
      <div
        role="group"
        aria-label="Select a service planet"
        className="container-page relative z-10 mt-8 flex flex-wrap justify-center gap-2.5"
      >
        {PLANETS.map((planet) => (
          <button
            key={planet.id}
            onClick={() => setFocused(focused === planet.id ? null : planet.id)}
            aria-pressed={focused === planet.id}
            className={cn(
              'glass rounded-full border-white/10 px-4 py-2 text-sm font-medium text-white/70 transition-all duration-300 hover:text-white',
              focused === planet.id && 'border-white/25 text-white shadow-glow-sm',
            )}
            style={focused === planet.id ? { boxShadow: `0 0 24px ${planet.color}44` } : undefined}
          >
            <span
              aria-hidden="true"
              className="mr-2 inline-block h-2 w-2 rounded-full"
              style={{ background: planet.color, boxShadow: `0 0 8px ${planet.color}` }}
            />
            {planet.label}
          </button>
        ))}
      </div>
    </section>
  );
}

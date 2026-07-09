'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { SectionHeading } from './section';
import { cn } from '@/lib/utils';

interface BentoCard {
  slug: string;
  title: string;
  description: string;
  span: string;
  illustration: 'browser' | 'phone' | 'window' | 'neural' | 'containers' | 'nodes' | 'api';
}

const CARDS: BentoCard[] = [
  {
    slug: 'web-applications',
    title: 'Web Development',
    description: 'High-performance sites and web apps with sub-second first paint.',
    span: 'md:col-span-2 md:row-span-2',
    illustration: 'browser',
  },
  {
    slug: 'mobile-applications',
    title: 'Mobile Apps',
    description: 'Native-quality iOS and Android from one codebase.',
    span: '',
    illustration: 'phone',
  },
  {
    slug: 'desktop-applications',
    title: 'Desktop Software',
    description: 'Cross-platform apps for Windows, macOS, and Linux.',
    span: '',
    illustration: 'window',
  },
  {
    slug: 'ai-solutions',
    title: 'Artificial Intelligence',
    description: 'Assistants, document pipelines, and automation that pay for themselves.',
    span: 'md:col-span-2',
    illustration: 'neural',
  },
  {
    slug: 'cloud-solutions',
    title: 'Cloud Infrastructure',
    description: 'Kubernetes, IaC, and bills that stop surprising you.',
    span: '',
    illustration: 'containers',
  },
  {
    slug: 'automation',
    title: 'Automation',
    description: 'Kill the copy-paste. Connected systems, audited workflows.',
    span: '',
    illustration: 'nodes',
  },
  {
    slug: 'api-development',
    title: 'API Development',
    description: 'Versioned, documented, monitored REST and event APIs.',
    span: 'md:col-span-2',
    illustration: 'api',
  },
];

/** Pure-CSS animated illustrations — no stock art, no icons. */
function Illustration({ kind }: { kind: BentoCard['illustration'] }) {
  switch (kind) {
    case 'browser':
      return (
        <div className="relative h-full min-h-36 w-full overflow-hidden">
          <div className="glass absolute left-[8%] top-[12%] h-[70%] w-[64%] rounded-2xl border-white/15 p-3 transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:rotate-[-1deg]">
            <div className="flex gap-1.5">
              {['#f87171', '#fbbf24', '#34d399'].map((c) => (
                <span key={c} className="h-2 w-2 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div className="mt-3 h-2 w-3/4 rounded-full bg-white/20" />
            <div className="mt-2 h-2 w-1/2 rounded-full bg-white/10" />
            <div className="mt-4 h-10 rounded-xl bg-gradient-to-r from-brand-500/40 to-accent-500/30" />
          </div>
          <div className="glass absolute right-[6%] top-[34%] h-[58%] w-[42%] rounded-2xl border-white/15 p-3 transition-transform duration-500 group-hover:-translate-y-3 group-hover:rotate-[1.5deg]">
            <div className="h-2 w-2/3 rounded-full bg-white/20" />
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-7 rounded-lg bg-white/10" />
              ))}
            </div>
          </div>
        </div>
      );
    case 'phone':
      return (
        <div className="flex h-full min-h-28 items-center justify-center">
          <div className="glass h-24 w-12 rounded-xl border-white/15 p-1.5 transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:rotate-[-4deg]">
            <div className="mx-auto h-1 w-4 rounded-full bg-white/25" />
            <div className="mt-1.5 h-8 rounded-lg bg-gradient-to-br from-accent-500/50 to-brand-500/40" />
            <div className="mt-1.5 h-1.5 rounded-full bg-white/15" />
            <div className="mt-1 h-1.5 w-2/3 rounded-full bg-white/10" />
          </div>
          <div className="glass -ml-3 mt-6 h-20 w-10 rounded-xl border-white/10 p-1.5 opacity-60 transition-transform duration-500 group-hover:translate-y-1 group-hover:rotate-[5deg]" />
        </div>
      );
    case 'window':
      return (
        <div className="flex h-full min-h-28 items-center justify-center">
          <div className="glass h-20 w-32 rounded-xl border-white/15 p-2 transition-transform duration-500 group-hover:-translate-y-1.5">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 rounded-full bg-white/25" />
              ))}
            </div>
            <div className="mt-2 flex gap-1.5">
              <div className="h-10 w-8 rounded-md bg-white/10" />
              <div className="flex-1 space-y-1.5">
                <div className="h-1.5 rounded-full bg-white/20" />
                <div className="h-1.5 w-3/4 rounded-full bg-white/10" />
                <div className="h-4 rounded-md bg-gradient-to-r from-cyan-400/30 to-brand-500/30" />
              </div>
            </div>
          </div>
        </div>
      );
    case 'neural':
      return (
        <div className="relative h-full min-h-28 w-full overflow-hidden">
          {Array.from({ length: 14 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 animate-float rounded-full bg-accent-400/70 shadow-[0_0_10px_rgba(167,139,250,0.8)]"
              style={{
                left: `${8 + ((i * 37) % 84)}%`,
                top: `${12 + ((i * 53) % 70)}%`,
                animationDelay: `${(i % 7) * -1.1}s`,
                animationDuration: `${5 + (i % 4)}s`,
              }}
            />
          ))}
          <svg aria-hidden="true" className="absolute inset-0 h-full w-full opacity-30">
            <line x1="15%" y1="30%" x2="45%" y2="60%" stroke="rgb(167,139,250)" strokeWidth="1" />
            <line x1="45%" y1="60%" x2="75%" y2="25%" stroke="rgb(96,165,250)" strokeWidth="1" />
            <line x1="30%" y1="75%" x2="60%" y2="40%" stroke="rgb(103,232,249)" strokeWidth="1" />
            <line x1="60%" y1="40%" x2="88%" y2="65%" stroke="rgb(167,139,250)" strokeWidth="1" />
          </svg>
        </div>
      );
    case 'containers':
      return (
        <div className="flex h-full min-h-28 flex-col items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="glass h-6 w-28 rounded-lg border-white/15 transition-transform duration-500"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="flex h-full items-center gap-1.5 px-2">
                <span
                  className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-cyan-300' : 'bg-brand-400',
                  )}
                />
                <div className="h-1.5 flex-1 rounded-full bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      );
    case 'nodes':
      return (
        <div className="relative h-full min-h-28 w-full">
          <svg aria-hidden="true" viewBox="0 0 200 100" className="h-full w-full">
            <path
              d="M20,50 C60,20 80,80 120,50 S180,30 185,50"
              fill="none"
              stroke="url(#nodeGradient)"
              strokeWidth="1.5"
              strokeDasharray="6 5"
              className="[animation:dash_3s_linear_infinite]"
            />
            <defs>
              <linearGradient id="nodeGradient" x1="0" x2="1">
                <stop offset="0" stopColor="#60a5fa" />
                <stop offset="1" stopColor="#a78bfa" />
              </linearGradient>
            </defs>
            {[
              [20, 50],
              [70, 42],
              [120, 50],
              [185, 50],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="5" fill="#0c1022" stroke="#818cf8" strokeWidth="1.5" />
            ))}
          </svg>
        </div>
      );
    case 'api':
      return (
        <div className="flex h-full min-h-24 items-center justify-center gap-2 font-mono text-xs">
          {['GET', 'POST', 'PATCH'].map((verb, i) => (
            <div
              key={verb}
              className="glass rounded-xl border-white/15 px-3 py-2 transition-transform duration-500 group-hover:-translate-y-1"
              style={{ transitionDelay: `${i * 70}ms` }}
            >
              <span
                className={cn(
                  'font-bold',
                  verb === 'GET' ? 'text-emerald-400' : verb === 'POST' ? 'text-cyan-300' : 'text-accent-400',
                )}
              >
                {verb}
              </span>
              <span className="text-white/50"> /v1/…</span>
            </div>
          ))}
        </div>
      );
  }
}

export function BentoGrid() {
  const reducedMotion = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <section id="solutions" className="relative bg-[#060916] py-32">
      <div className="nebula pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="container-page relative">
        <SectionHeading
          eyebrow="Solutions"
          title="Every domain of software"
          description="Seven disciplines, one accountable team. Pick a card, we handle the rest."
        />
        <div ref={gridRef} className="grid auto-rows-[minmax(180px,auto)] gap-5 md:grid-cols-4">
          {CARDS.map((card, i) => (
            <motion.div
              key={card.slug}
              initial={reducedMotion ? undefined : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.07, ease: [0.21, 0.65, 0.36, 1] }}
              className={card.span}
            >
              <Link
                href={`/services#${card.slug}`}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  e.currentTarget.style.setProperty('--glow-x', `${e.clientX - rect.left}px`);
                  e.currentTarget.style.setProperty('--glow-y', `${e.clientY - rect.top}px`);
                }}
                className="panel glow-border group flex h-full flex-col gap-4 overflow-hidden !border-white/[0.08] !bg-white/[0.03] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-glow-sm"
              >
                <div className="flex-1">
                  <Illustration kind={card.illustration} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white">{card.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/55">{card.description}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

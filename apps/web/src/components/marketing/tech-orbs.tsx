'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TechOrb {
  name: string;
  color: string;
  blurb: string;
  projects: number;
  stack: string[];
}

const ORBS: TechOrb[] = [
  { name: 'React', color: '#67e8f9', blurb: 'Our default for every interface — web, native, and desktop shells.', projects: 74, stack: ['Next.js', 'React Native', 'TanStack'] },
  { name: 'TypeScript', color: '#60a5fa', blurb: 'One typed language across the whole stack. Fewer bugs, faster refactors.', projects: 88, stack: ['Node.js', 'NestJS', 'Zod'] },
  { name: 'Node.js', color: '#34d399', blurb: 'APIs, workers, and realtime backends measured in single-digit milliseconds.', projects: 61, stack: ['NestJS', 'BullMQ', 'Prisma'] },
  { name: 'Laravel', color: '#f87171', blurb: 'Battle-tested PHP for teams already invested in its ecosystem.', projects: 18, stack: ['Livewire', 'Horizon', 'Octane'] },
  { name: 'Flutter', color: '#7dd3fc', blurb: 'Pixel-perfect multi-platform apps when a single rendering engine wins.', projects: 12, stack: ['Dart', 'Riverpod', 'Firebase-free builds'] },
  { name: 'Electron', color: '#a78bfa', blurb: 'Desktop software with web velocity — plus Tauri when footprint matters.', projects: 15, stack: ['Tauri', 'Rust', 'Auto-update'] },
  { name: 'Docker', color: '#38bdf8', blurb: 'Every project ships as containers with compose files and CI baked in.', projects: 92, stack: ['Compose', 'Kubernetes', 'NGINX'] },
  { name: 'AWS', color: '#fbbf24', blurb: 'Cloud architecture that scales — and self-hosted when sovereignty wins.', projects: 43, stack: ['Terraform', 'ECS/EKS', 'CloudFront'] },
];

/** Floating technology orbs. Hover / focus expands an orb into a detail card. */
export function TechOrbs() {
  const [active, setActive] = useState<string | null>(null);
  const reducedMotion = useReducedMotion();
  const current = ORBS.find((o) => o.name === active);

  return (
    <section className="relative overflow-hidden bg-[#060916] py-32">
      <div className="nebula pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="container-page relative">
        <div className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Technology</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            The matter our universe is <span className="text-gradient-cool">made of</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8">
          {ORBS.map((orb, i) => {
            const isActive = active === orb.name;
            return (
              <motion.button
                key={orb.name}
                onMouseEnter={() => setActive(orb.name)}
                onFocus={() => setActive(orb.name)}
                onClick={() => setActive(isActive ? null : orb.name)}
                aria-expanded={isActive}
                animate={
                  reducedMotion
                    ? undefined
                    : { y: [0, i % 2 === 0 ? -10 : 10, 0] }
                }
                transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: 'easeInOut' }}
                whileHover={{ scale: 1.12 }}
                className={cn(
                  'glass relative flex h-24 w-24 items-center justify-center rounded-full border-white/10 font-display text-sm font-semibold text-white/80 transition-shadow duration-500 sm:h-28 sm:w-28',
                  isActive && 'text-white',
                )}
                style={{
                  boxShadow: isActive
                    ? `0 0 42px ${orb.color}55, inset 0 0 24px ${orb.color}22`
                    : `inset 0 0 18px ${orb.color}14`,
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full opacity-40"
                  style={{ background: `radial-gradient(circle at 30% 25%, ${orb.color}33, transparent 60%)` }}
                />
                {orb.name}
              </motion.button>
            );
          })}
        </div>

        <div className="mx-auto mt-12 min-h-32 max-w-xl">
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current.name}
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.21, 0.65, 0.36, 1] }}
                className="glass rounded-card border-white/10 p-6 text-center"
              >
                <div className="flex items-center justify-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: current.color, boxShadow: `0 0 10px ${current.color}` }}
                  />
                  <h3 className="font-display text-lg font-bold text-white">{current.name}</h3>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/70">
                    {current.projects} projects
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{current.blurb}</p>
                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  {current.stack.map((item) => (
                    <span key={item} className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-xs text-white/60">
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

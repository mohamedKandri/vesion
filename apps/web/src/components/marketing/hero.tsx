'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const HeroScene = dynamic(() => import('@/components/three/hero-scene'), { ssr: false });

/**
 * Static nebula backdrop: the reduced-motion / loading fallback for the 3D
 * scene, and the ambient background used by other pages (auth, about).
 */
export function AnimatedBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 nebula" />
      <div className="absolute -top-32 left-1/4 h-96 w-96 animate-aurora rounded-full bg-brand-600/25 blur-[120px]" />
      <div className="absolute right-1/4 top-24 h-80 w-80 animate-aurora rounded-full bg-accent-600/20 blur-[110px] [animation-delay:-6s]" />
      <div className="absolute bottom-0 left-1/2 h-72 w-72 animate-aurora rounded-full bg-brand-400/15 blur-[100px] [animation-delay:-12s]" />
    </div>
  );
}

const EASE = [0.21, 0.65, 0.36, 1] as const;

export function Hero() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#060916]">
      {/* 3D scene (or static nebula for reduced motion) */}
      {reducedMotion ? <AnimatedBackground /> : (
        <>
          <AnimatedBackground />
          <div className="absolute inset-0 hidden sm:block">
            <HeroScene />
          </div>
        </>
      )}

      {/* Soft vignette so type always stays readable over the scene */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 60% at 50% 45%, transparent 30%, rgba(6,9,22,0.55) 78%, rgba(6,9,22,0.92) 100%)',
        }}
      />

      <div className="container-page relative z-10 flex min-h-screen flex-col items-center justify-center py-28 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="glass mb-10 inline-flex items-center gap-2.5 rounded-full px-5 py-2 text-sm text-white/80"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
          The Vesion software universe
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
          className="max-w-5xl font-display text-5xl font-bold leading-[1.04] tracking-tight text-white sm:text-7xl lg:text-8xl"
        >
          Engineering
          <br />
          <span className="text-gradient-cool">extraordinary software</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: EASE }}
          className="mt-8 max-w-xl text-lg text-white/60 sm:text-xl"
        >
          Web. Mobile. Desktop. AI. Cloud. One studio, engineered around your product.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
          className="mt-12 flex flex-col gap-4 sm:flex-row"
        >
          <Link href="/contact">
            <Button size="lg" className="rounded-2xl px-9">
              Start a project
            </Button>
          </Link>
          <Link href="/portfolio">
            <Button
              size="lg"
              variant="ghost"
              className="rounded-2xl border border-white/15 px-9 text-white hover:bg-white/10"
            >
              Explore the universe ↓
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          aria-hidden="true"
        >
          <div className="flex h-10 w-6 items-start justify-center rounded-full border border-white/20 p-1.5">
            <motion.span
              animate={reducedMotion ? undefined : { y: [0, 12, 0], opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="h-2 w-1 rounded-full bg-white/60"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

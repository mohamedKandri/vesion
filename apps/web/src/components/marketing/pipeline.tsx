'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STAGES = [
  { id: 'idea', label: 'Idea', description: 'You bring the ambition; we pressure-test it.' },
  { id: 'research', label: 'Research', description: 'Users, market, constraints, risk.' },
  { id: 'design', label: 'Design', description: 'Flows and UI validated before code.' },
  { id: 'development', label: 'Development', description: 'Two-week sprints, live dashboard.' },
  { id: 'testing', label: 'Testing', description: 'Unit → integration → end-to-end.' },
  { id: 'deployment', label: 'Deployment', description: 'Zero-downtime, monitored, reversible.' },
  { id: 'launch', label: 'Launch', description: 'Stabilize, measure, iterate.' },
];

/**
 * Development represented as an animated energy pipeline: a beam of light
 * flows down the line and each stage node ignites as the user scrolls.
 */
export function Pipeline() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      section.querySelectorAll('[data-stage]').forEach((el) => el.classList.add('stage-lit'));
      const beam = section.querySelector<HTMLElement>('[data-beam]');
      if (beam) beam.style.height = '100%';
      return;
    }

    const ctx = gsap.context(() => {
      gsap.to('[data-beam]', {
        height: '100%',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top 65%',
          end: 'bottom 60%',
          scrub: 0.6,
        },
      });

      gsap.utils.toArray<HTMLElement>('[data-stage]').forEach((stage) => {
        ScrollTrigger.create({
          trigger: stage,
          start: 'top 62%',
          onEnter: () => stage.classList.add('stage-lit'),
          onLeaveBack: () => stage.classList.remove('stage-lit'),
        });
        gsap.fromTo(
          stage,
          { opacity: 0, x: stage.dataset.side === 'left' ? -28 : 28 },
          {
            opacity: 1,
            x: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: stage, start: 'top 78%' },
          },
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section id="process" ref={sectionRef} className="relative bg-[#060916] py-32">
      <div className="container-page">
        <div className="mb-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Process</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            From spark to <span className="text-gradient-cool">launch</span>
          </h2>
        </div>

        <div className="relative mx-auto max-w-3xl">
          {/* Pipeline rail + energy beam */}
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10"
          />
          <div
            data-beam
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-0 w-px -translate-x-1/2 bg-gradient-to-b from-brand-400 via-accent-500 to-cyan-300 shadow-[0_0_18px_rgba(124,108,255,0.8)]"
          />

          <ol className="relative space-y-16">
            {STAGES.map((stage, i) => {
              const left = i % 2 === 0;
              return (
                <li
                  key={stage.id}
                  data-stage
                  data-side={left ? 'left' : 'right'}
                  className={`group relative flex ${left ? 'justify-start' : 'justify-end'} [&.stage-lit_[data-node]]:scale-100 [&.stage-lit_[data-node]]:bg-brand-400 [&.stage-lit_[data-node]]:shadow-[0_0_22px_rgba(129,140,248,0.95)] [&.stage-lit_[data-card]]:border-white/20 [&.stage-lit_[data-card]]:text-white`}
                >
                  <span
                    data-node
                    aria-hidden="true"
                    className="absolute left-1/2 top-3 h-3.5 w-3.5 -translate-x-1/2 scale-75 rounded-full bg-white/20 transition-all duration-500"
                  />
                  <div
                    data-card
                    className={`glass w-[calc(50%-2.5rem)] rounded-card border-white/[0.08] p-6 text-white/60 transition-colors duration-500 ${
                      left ? 'text-right' : 'text-left'
                    }`}
                  >
                    <p className="font-display text-lg font-bold">{stage.label}</p>
                    <p className="mt-1 text-sm">{stage.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { PortfolioItem } from '@/lib/types';

gsap.registerPlugin(ScrollTrigger);

const INDUSTRY_GRADIENTS: Record<string, string> = {
  Logistics: 'from-brand-600/50 to-sky-600/30',
  Healthcare: 'from-emerald-600/50 to-teal-600/30',
  'E-commerce': 'from-accent-600/50 to-pink-600/30',
  Manufacturing: 'from-amber-600/50 to-orange-600/30',
};

/**
 * Digital museum: project panels floating in space. The section pins and the
 * camera "flies" horizontally between panels as the user scrolls; panels gain
 * depth with staggered parallax. Falls back to a swipeable row when motion is
 * reduced or on touch layouts.
 */
export function PortfolioFlythrough({ items }: { items: PortfolioItem[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || items.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 1023px)').matches) return;

    const ctx = gsap.context(() => {
      const distance = track.scrollWidth - window.innerWidth;
      gsap.to(track, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance}`,
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Depth: each panel drifts at a slightly different rate.
      gsap.utils.toArray<HTMLElement>('[data-fly-panel]').forEach((panel, i) => {
        gsap.fromTo(
          panel,
          { y: i % 2 === 0 ? 34 : -22, rotate: i % 2 === 0 ? 1.2 : -1.2 },
          {
            y: i % 2 === 0 ? -22 : 34,
            rotate: 0,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top top',
              end: () => `+=${distance}`,
              scrub: 1.2,
            },
          },
        );
      });
    }, section);

    return () => ctx.revert();
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#060916]"
      aria-label="Selected work"
    >
      <div className="nebula pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="relative flex min-h-screen flex-col justify-center py-24">
        <div className="container-page mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">Work</p>
          <h2 className="mt-3 max-w-xl font-display text-3xl font-bold tracking-tight text-white sm:text-5xl">
            A museum of <span className="text-gradient-cool">shipped products</span>
          </h2>
        </div>

        <div
          ref={trackRef}
          className="flex gap-8 overflow-x-auto px-6 pb-6 scrollbar-thin lg:w-max lg:overflow-visible lg:px-[12vw] lg:pb-0"
        >
          {items.map((item) => {
            const gradient = INDUSTRY_GRADIENTS[item.industry ?? ''] ?? 'from-brand-600/50 to-accent-600/30';
            const href = item.isCaseStudy ? `/case-studies/${item.slug}` : `/portfolio/${item.slug}`;
            return (
              <Link
                key={item.id}
                href={href}
                data-fly-panel
                className="glass group relative flex w-[85vw] max-w-md shrink-0 flex-col rounded-panel border-white/10 p-3 transition-all duration-500 hover:border-white/25 hover:shadow-glow-sm lg:w-[30rem] lg:max-w-none"
              >
                <div
                  className={`relative flex h-56 items-end overflow-hidden rounded-[calc(var(--radius-panel)-0.75rem)] bg-gradient-to-br ${gradient} p-6`}
                >
                  <span className="font-display text-3xl font-bold text-white/95 transition-transform duration-500 group-hover:scale-[1.02]">
                    {item.title.split('—')[0].trim()}
                  </span>
                  {item.isCaseStudy && (
                    <span className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      Case study
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
                    {item.industry}
                  </span>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">{item.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {item.technologies.slice(0, 4).map((tech) => (
                      <span
                        key={tech}
                        className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-xs font-medium text-white/70"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}

          <Link
            href="/portfolio"
            data-fly-panel
            className="glass flex w-64 shrink-0 flex-col items-center justify-center rounded-panel border-white/10 text-center transition hover:border-white/25"
          >
            <span className="font-display text-4xl text-gradient-cool">→</span>
            <span className="mt-3 font-semibold text-white">Full portfolio</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

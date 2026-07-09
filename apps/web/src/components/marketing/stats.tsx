'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { Reveal } from './section';

function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(end * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, end]);

  return (
    <span ref={ref}>
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

const STATS = [
  { value: 120, suffix: '+', label: 'Projects delivered' },
  { value: 40, suffix: '+', label: 'Long-term clients' },
  { value: 9, suffix: '', label: 'Countries served' },
  { value: 99, suffix: '.9%', label: 'Uptime across production systems' },
];

export function Stats() {
  return (
    <section aria-label="Company statistics" className="border-y border-white/[0.07] bg-[#060916]">
      <div className="container-page grid grid-cols-2 gap-8 py-16 lg:grid-cols-4">
        {STATS.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.08} className="text-center">
            <p className="font-display text-4xl font-bold text-gradient-cool sm:text-5xl">
              <CountUp end={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-2 text-sm text-white/50">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

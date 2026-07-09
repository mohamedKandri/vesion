import { TECH_STACK } from '@/content/site';

export function TechMarquee() {
  const items = [...TECH_STACK, ...TECH_STACK]; // duplicated for a seamless loop

  return (
    <section aria-label="Technology stack" className="overflow-hidden border-y border-[rgb(var(--card-border))] py-8">
      <div className="flex w-max animate-marquee gap-4 hover:[animation-play-state:paused]">
        {items.map((tech, i) => (
          <span
            key={`${tech.name}-${i}`}
            className="glass-light flex items-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-sm font-medium"
          >
            <span className="text-brand-500">◆</span>
            {tech.name}
            <span className="text-xs text-[rgb(var(--muted))]">{tech.category}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

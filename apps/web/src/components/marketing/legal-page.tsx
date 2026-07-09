import { Markdown } from '@/components/markdown';

export function LegalPage({
  title,
  updated,
  content,
}: {
  title: string;
  updated: string;
  content: string;
}) {
  return (
    <article className="container-page max-w-3xl py-24">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">Last updated: {updated}</p>
      <div className="mt-10">
        <Markdown content={content} />
      </div>
    </article>
  );
}

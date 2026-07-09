import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverFetch } from '@/lib/api';
import type { BlogPost } from '@/lib/types';
import { Markdown } from '@/components/markdown';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib/utils';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await serverFetch<BlogPost>(`/blog/posts/${params.slug}`, 120);
  if (!post) return { title: 'Post not found' };
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: { title: post.title, description: post.excerpt, type: 'article' },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await serverFetch<BlogPost>(`/blog/posts/${params.slug}`, 120);
  if (!post) notFound();

  return (
    <article className="container-page max-w-3xl py-24">
      <Link href="/blog" className="text-sm font-medium text-brand-500 hover:underline">
        ← All posts
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[rgb(var(--muted))]">
          {post.category && (
            <span className="rounded-full bg-brand-500/10 px-3 py-0.5 text-xs font-semibold text-brand-500">
              {post.category.name}
            </span>
          )}
          <span>{formatDate(post.publishedAt)}</span>
          <span aria-hidden="true">·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        {post.author && (
          <div className="mt-6 flex items-center gap-3">
            <Avatar
              firstName={post.author.firstName}
              lastName={post.author.lastName}
              src={post.author.avatarUrl}
            />
            <div>
              <p className="text-sm font-semibold">
                {post.author.firstName} {post.author.lastName}
              </p>
              {post.author.jobTitle && (
                <p className="text-xs text-[rgb(var(--muted))]">{post.author.jobTitle}</p>
              )}
            </div>
          </div>
        )}
      </header>

      {post.content && (
        <div className="mt-10">
          <Markdown content={post.content} />
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium dark:bg-white/10">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {post.related && post.related.length > 0 && (
        <aside className="mt-16 border-t border-[rgb(var(--card-border))] pt-10">
          <h2 className="font-display text-xl font-bold">Keep reading</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {post.related.map((related) => (
              <Link
                key={related.id}
                href={`/blog/${related.slug}`}
                className="rounded-xl border border-[rgb(var(--card-border))] p-4 transition hover:border-brand-500/50"
              >
                <p className="text-sm font-semibold leading-snug">{related.title}</p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  {related.readingMinutes} min read
                </p>
              </Link>
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}

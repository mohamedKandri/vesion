import type { MetadataRoute } from 'next';
import { serverFetch } from '@/lib/api';
import type { BlogPost, Paginated, PortfolioItem } from '@/lib/types';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const STATIC_PAGES = [
  '',
  '/about',
  '/services',
  '/portfolio',
  '/case-studies',
  '/pricing',
  '/careers',
  '/blog',
  '/contact',
  '/faq',
  '/privacy-policy',
  '/terms-of-service',
  '/cookie-policy',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, portfolio] = await Promise.all([
    serverFetch<Paginated<BlogPost>>('/blog/posts?limit=100', 3600),
    serverFetch<Paginated<PortfolioItem>>('/portfolio?limit=100', 3600),
  ]);

  return [
    ...STATIC_PAGES.map((path) => ({
      url: `${BASE}${path}`,
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
    ...(posts?.items ?? []).map((post) => ({
      url: `${BASE}/blog/${post.slug}`,
      lastModified: post.publishedAt ?? undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...(portfolio?.items ?? []).map((item) => ({
      url: `${BASE}/${item.isCaseStudy ? 'case-studies' : 'portfolio'}/${item.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}

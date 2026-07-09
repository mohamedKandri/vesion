'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePagedQuery, useApiQuery } from '@/lib/hooks';
import type { BlogPost, KbArticle, KbCategory, PortfolioItem } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { Tabs } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

export default function ContentCmsPage() {
  const [tab, setTab] = useState('blog');
  return (
    <>
      <PageHeader title="Content CMS" description="Blog, portfolio, and knowledge-base publishing." />
      <Tabs
        tabs={[
          { id: 'blog', label: 'Blog' },
          { id: 'portfolio', label: 'Portfolio' },
          { id: 'kb', label: 'Knowledge base' },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />
      {tab === 'blog' && <BlogCms />}
      {tab === 'portfolio' && <PortfolioCms />}
      {tab === 'kb' && <KbCms />}
    </>
  );
}

// ─────────────────────────── Blog ───────────────────────────

interface BlogFormValues {
  title: string;
  excerpt: string;
  content: string;
  tags: string;
  status: string;
}

function BlogCms() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<BlogPost | 'new' | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const form = useForm<BlogFormValues>();

  const { data, isLoading } = usePagedQuery<BlogPost>(['cms-blog'], '/blog/posts', {
    page,
    limit: 15,
    status: undefined,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/blog/posts/${id}`),
    onSuccess: () => {
      success('Post deleted');
      void queryClient.invalidateQueries({ queryKey: ['cms-blog'] });
    },
    onError: (err) => error('Delete failed', (err as Error).message),
  });

  function openEditor(post: BlogPost | 'new') {
    setEditing(post);
    form.reset(
      post === 'new'
        ? { title: '', excerpt: '', content: '', tags: '', status: 'DRAFT' }
        : {
            title: post.title,
            excerpt: post.excerpt,
            content: post.content ?? '',
            tags: post.tags.join(', '),
            status: post.status,
          },
    );
  }

  async function onSave(values: BlogFormValues) {
    const payload = {
      title: values.title,
      excerpt: values.excerpt,
      content: values.content,
      tags: values.tags.split(',').map((t) => t.trim()).filter(Boolean),
      status: values.status,
    };
    try {
      if (editing === 'new') await api.post('/blog/posts', payload);
      else if (editing) await api.patch(`/blog/posts/${editing.id}`, payload);
      success('Post saved');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['cms-blog'] });
    } catch (err) {
      error('Save failed', (err as Error).message);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => openEditor('new')}>+ New post</Button>
      </div>
      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No posts yet" />
      ) : (
        <div className="space-y-2">
          {data!.items.map((post) => (
            <div key={post.id} className="card flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{post.title}</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {post.category?.name ?? 'Uncategorized'} · {post.views} views ·{' '}
                  {formatDate(post.publishedAt ?? undefined)}
                </p>
              </div>
              <StatusBadge status={post.status} />
              <Button variant="ghost" size="sm" onClick={() => openEditor(post)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => remove.mutate(post.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New post' : 'Edit post'}
        className="max-w-3xl"
      >
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
          <Input label="Title" {...form.register('title', { required: true, minLength: 5 })} />
          <Textarea label="Excerpt" className="min-h-20" {...form.register('excerpt', { required: true })} />
          <Textarea
            label="Content (markdown)"
            className="min-h-72 font-mono text-xs"
            {...form.register('content', { required: true })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Tags (comma separated)" {...form.register('tags')} />
            <Select label="Status" {...form.register('status')}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Save post
          </Button>
        </form>
      </Modal>
    </>
  );
}

// ─────────────────────── Portfolio ───────────────────────

interface PortfolioFormValues {
  title: string;
  summary: string;
  content: string;
  industry: string;
  technologies: string;
  isCaseStudy: boolean;
  featured: boolean;
  status: string;
  challenge?: string;
  solution?: string;
  results?: string;
}

function PortfolioCms() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PortfolioItem | 'new' | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const form = useForm<PortfolioFormValues>();

  const { data, isLoading } = usePagedQuery<PortfolioItem>(['cms-portfolio'], '/portfolio', {
    page,
    limit: 15,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/portfolio/${id}`),
    onSuccess: () => {
      success('Item deleted');
      void queryClient.invalidateQueries({ queryKey: ['cms-portfolio'] });
    },
    onError: (err) => error('Delete failed', (err as Error).message),
  });

  function openEditor(item: PortfolioItem | 'new') {
    setEditing(item);
    form.reset(
      item === 'new'
        ? { title: '', summary: '', content: '', industry: '', technologies: '', isCaseStudy: false, featured: false, status: 'DRAFT' }
        : {
            title: item.title,
            summary: item.summary,
            content: item.content ?? '',
            industry: item.industry ?? '',
            technologies: item.technologies.join(', '),
            isCaseStudy: item.isCaseStudy,
            featured: item.featured,
            status: item.status,
            challenge: item.challenge ?? '',
            solution: item.solution ?? '',
            results: item.results ?? '',
          },
    );
  }

  async function onSave(values: PortfolioFormValues) {
    const payload = {
      title: values.title,
      summary: values.summary,
      content: values.content,
      industry: values.industry || undefined,
      technologies: values.technologies.split(',').map((t) => t.trim()).filter(Boolean),
      isCaseStudy: values.isCaseStudy,
      featured: values.featured,
      status: values.status,
      challenge: values.challenge || undefined,
      solution: values.solution || undefined,
      results: values.results || undefined,
    };
    try {
      if (editing === 'new') await api.post('/portfolio', payload);
      else if (editing) await api.patch(`/portfolio/${editing.id}`, payload);
      success('Portfolio item saved');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['cms-portfolio'] });
    } catch (err) {
      error('Save failed', (err as Error).message);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => openEditor('new')}>+ New item</Button>
      </div>
      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No portfolio items yet" />
      ) : (
        <div className="space-y-2">
          {data!.items.map((item) => (
            <div key={item.id} className="card flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">
                  {item.title}
                  {item.featured && <span className="ml-2 text-xs text-amber-500">★ featured</span>}
                  {item.isCaseStudy && <span className="ml-2 text-xs text-brand-500">case study</span>}
                </p>
                <p className="text-xs text-[rgb(var(--muted))]">{item.industry ?? '—'}</p>
              </div>
              <StatusBadge status={item.status} />
              <Button variant="ghost" size="sm" onClick={() => openEditor(item)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => remove.mutate(item.id)}>
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New portfolio item' : 'Edit portfolio item'}
        className="max-w-3xl"
      >
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
          <Input label="Title" {...form.register('title', { required: true })} />
          <Textarea label="Summary" className="min-h-20" {...form.register('summary', { required: true })} />
          <Textarea
            label="Content (markdown)"
            className="min-h-48 font-mono text-xs"
            {...form.register('content', { required: true })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Industry" {...form.register('industry')} />
            <Input label="Technologies (comma separated)" {...form.register('technologies')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-brand-500" {...form.register('isCaseStudy')} />
              Case study
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4 accent-brand-500" {...form.register('featured')} />
              Featured
            </label>
            <Select label="Status" {...form.register('status')}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
          <details className="rounded-xl border border-[rgb(var(--card-border))] p-4">
            <summary className="cursor-pointer text-sm font-medium">Case study fields</summary>
            <div className="mt-4 space-y-4">
              <Textarea label="Challenge" className="min-h-20" {...form.register('challenge')} />
              <Textarea label="Solution" className="min-h-20" {...form.register('solution')} />
              <Textarea label="Results" className="min-h-20" {...form.register('results')} />
            </div>
          </details>
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Save item
          </Button>
        </form>
      </Modal>
    </>
  );
}

// ─────────────────────── Knowledge base ───────────────────────

interface KbFormValues {
  title: string;
  excerpt: string;
  body: string;
  categoryId: string;
  keywords: string;
  status: string;
}

function KbCms() {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<KbArticle | 'new' | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const form = useForm<KbFormValues>();

  const { data, isLoading } = usePagedQuery<KbArticle>(['cms-kb'], '/knowledge-base/articles', {
    page,
    limit: 15,
  });
  const { data: categories } = useApiQuery<KbCategory[]>(['kb-categories'], '/knowledge-base/categories');

  function openEditor(article: KbArticle | 'new') {
    setEditing(article);
    form.reset(
      article === 'new'
        ? { title: '', excerpt: '', body: '', categoryId: '', keywords: '', status: 'DRAFT' }
        : {
            title: article.title,
            excerpt: article.excerpt,
            body: article.body ?? '',
            categoryId: article.category.id,
            keywords: '',
            status: article.status,
          },
    );
  }

  async function onSave(values: KbFormValues) {
    const payload = {
      title: values.title,
      excerpt: values.excerpt,
      body: values.body,
      categoryId: values.categoryId,
      keywords: values.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      status: values.status,
    };
    try {
      if (editing === 'new') await api.post('/knowledge-base/articles', payload);
      else if (editing) await api.patch(`/knowledge-base/articles/${editing.id}`, payload);
      success('Article saved');
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['cms-kb'] });
    } catch (err) {
      error('Save failed', (err as Error).message);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => openEditor('new')}>+ New article</Button>
      </div>
      {isLoading ? (
        <TableSkeleton />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState title="No articles yet" />
      ) : (
        <div className="space-y-2">
          {data!.items.map((article) => (
            <div key={article.id} className="card flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{article.title}</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {article.category.name} · {article.views} views · 👍 {article.helpfulYes ?? 0} / 👎{' '}
                  {article.helpfulNo ?? 0}
                </p>
              </div>
              <StatusBadge status={article.status} />
              <Button variant="ghost" size="sm" onClick={() => openEditor(article)}>
                Edit
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'New article' : 'Edit article'}
        className="max-w-3xl"
      >
        <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
          <Input label="Title" {...form.register('title', { required: true, minLength: 5 })} />
          <Textarea label="Excerpt" className="min-h-20" {...form.register('excerpt', { required: true })} />
          <Textarea
            label="Body (markdown) — also powers the AI assistant's answers"
            className="min-h-64 font-mono text-xs"
            {...form.register('body', { required: true })}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Select label="Category" {...form.register('categoryId', { required: true })}>
              <option value="">Select…</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input label="Keywords (comma separated)" {...form.register('keywords')} />
            <Select label="Status" {...form.register('status')}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Save article
          </Button>
        </form>
      </Modal>
    </>
  );
}

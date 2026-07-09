'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/api';
import { SITE } from '@/content/site';

const COLUMNS = [
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/careers', label: 'Careers' },
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Services',
    links: [
      { href: '/services#web-applications', label: 'Web Applications' },
      { href: '/services#mobile-applications', label: 'Mobile Apps' },
      { href: '/services#ai-solutions', label: 'AI Solutions' },
      { href: '/services#cybersecurity-consulting', label: 'Cybersecurity' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '/portfolio', label: 'Portfolio' },
      { href: '/case-studies', label: 'Case Studies' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy-policy', label: 'Privacy Policy' },
      { href: '/terms-of-service', label: 'Terms of Service' },
      { href: '/cookie-policy', label: 'Cookie Policy' },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact/newsletter', { email }, { anonymous: true });
      success('Subscribed!', 'Welcome to the VESION newsletter.');
      setEmail('');
    } catch (err) {
      error('Subscription failed', (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <footer className="border-t border-[rgb(var(--card-border))]">
      <div className="container-page py-16">
        <div className="grid gap-10 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-[rgb(var(--muted))]">{SITE.tagline}</p>
            <form onSubmit={subscribe} className="mt-6 flex max-w-sm gap-2">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="h-10 flex-1 rounded-xl border border-[rgb(var(--card-border))] bg-transparent px-3 text-sm placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none"
              />
              <Button type="submit" size="md" loading={loading}>
                Subscribe
              </Button>
            </form>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[rgb(var(--muted))] transition hover:text-brand-500"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[rgb(var(--card-border))] pt-8 sm:flex-row">
          <p className="text-sm text-[rgb(var(--muted))]">
            © {new Date().getFullYear()} VESION. All rights reserved.
          </p>
          <div className="flex gap-5 text-sm text-[rgb(var(--muted))]">
            <a href={SITE.social.github} rel="noopener noreferrer" target="_blank" className="hover:text-brand-500">
              GitHub
            </a>
            <a href={SITE.social.linkedin} rel="noopener noreferrer" target="_blank" className="hover:text-brand-500">
              LinkedIn
            </a>
            <a href={SITE.social.x} rel="noopener noreferrer" target="_blank" className="hover:text-brand-500">
              X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

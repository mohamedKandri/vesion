'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/portfolio', label: 'Work' },
  { href: '/services', label: 'Solutions' },
  { href: '/#process', label: 'Process' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/** Floating glass pill navigation. Shrinks subtly on scroll. */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href.startsWith('/#') ? false : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4">
      <motion.nav
        aria-label="Main navigation"
        animate={{ scale: scrolled ? 0.94 : 1, y: scrolled ? -2 : 0 }}
        transition={{ duration: 0.35, ease: [0.21, 0.65, 0.36, 1] }}
        className={cn(
          'glass-light flex w-full max-w-3xl items-center justify-between rounded-full py-2 pl-5 pr-2 shadow-glass transition-colors',
          scrolled && 'bg-white/80 dark:bg-[#0a0e20]/80',
        )}
      >
        <Logo className="text-lg" />

        <div className="hidden items-center lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition',
                isActive(link.href)
                  ? 'bg-black/5 text-brand-500 dark:bg-white/10'
                  : 'text-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]',
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-1.5 lg:flex">
          <ThemeToggle className="!rounded-full border-transparent" />
          <Link
            href="/login"
            className="rounded-full px-3.5 py-1.5 text-sm font-medium text-[rgb(var(--muted))] transition hover:text-[rgb(var(--foreground))]"
          >
            Sign in
          </Link>
          <Link
            href="/contact"
            className="rounded-full bg-brand-gradient px-5 py-2 text-sm font-semibold text-white shadow-glow-sm transition hover:opacity-90"
          >
            Start
          </Link>
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <ThemeToggle className="!rounded-full border-transparent" />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-black/5 dark:hover:bg-white/10"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </motion.nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass-light absolute left-4 right-4 top-[4.5rem] rounded-3xl p-3 shadow-glass lg:hidden"
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-2xl px-4 py-3 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[rgb(var(--card-border))] p-2 pt-3">
              <Link
                href="/login"
                className="rounded-full border border-[rgb(var(--card-border))] px-4 py-2.5 text-center text-sm font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/contact"
                className="rounded-full bg-brand-gradient px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Start
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

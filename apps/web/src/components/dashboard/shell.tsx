'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-store';
import type { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Avatar } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { NotificationsBell } from './notifications-bell';

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

export function DashboardShell({
  nav,
  allowedRoles,
  title,
  children,
}: {
  nav: NavItem[];
  allowedRoles: UserRole[];
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, status, bootstrap, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (status === 'authenticated' && user && !allowedRoles.includes(user.role)) {
      router.replace(user.role === 'CLIENT' ? '/dashboard' : '/admin');
    }
  }, [status, user, allowedRoles, pathname, router]);

  useEffect(() => setSidebarOpen(false), [pathname]);

  if (status !== 'authenticated' || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-brand-500" />
      </div>
    );
  }

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[rgb(var(--card-border))] bg-[rgb(var(--card))] transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        aria-label={`${title} navigation`}
      >
        <div className="flex h-16 items-center border-b border-[rgb(var(--card-border))] px-6">
          <Logo href={nav[0]?.href ?? '/'} />
          <span className="ml-2 rounded-md bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-500">
            {title}
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-thin">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive(item)
                  ? 'bg-brand-500/10 text-brand-500'
                  : 'text-[rgb(var(--muted))] hover:bg-black/5 hover:text-[rgb(var(--foreground))] dark:hover:bg-white/5',
              )}
            >
              <span aria-hidden="true" className="w-5 text-center">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[rgb(var(--card-border))] p-3">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-[rgb(var(--muted))]">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              void logout().then(() => router.push('/login'));
            }}
            className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[rgb(var(--muted))] transition hover:bg-black/5 hover:text-red-500 dark:hover:bg-white/5"
          >
            ↪ Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[rgb(var(--card-border))] bg-[rgb(var(--background))]/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(var(--card-border))] lg:hidden"
          >
            ☰
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <NotificationsBell />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

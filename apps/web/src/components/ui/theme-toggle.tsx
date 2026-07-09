'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <span className={className} aria-hidden="true" style={{ width: 36, height: 36 }} />;
  }

  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(var(--card-border))] transition hover:bg-black/5 dark:hover:bg-white/10 ${className ?? ''}`}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}

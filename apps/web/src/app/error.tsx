'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl font-bold text-gradient">500</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-[rgb(var(--muted))]">
        An unexpected error occurred. It has been logged — try again, and if it persists, contact
        support.
      </p>
      <div className="mt-8 flex gap-4">
        <Button onClick={reset}>Try again</Button>
        <a href="/">
          <Button variant="outline">Back to home</Button>
        </a>
      </div>
    </div>
  );
}

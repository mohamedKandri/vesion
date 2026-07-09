import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-8xl font-bold text-gradient">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">This page doesn't exist</h1>
      <p className="mt-2 max-w-sm text-[rgb(var(--muted))]">
        The page you're looking for was moved, deleted, or never shipped. Let's get you back on
        track.
      </p>
      <div className="mt-8 flex gap-4">
        <Link href="/">
          <Button>Back to home</Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline">Contact us</Button>
        </Link>
      </div>
    </div>
  );
}

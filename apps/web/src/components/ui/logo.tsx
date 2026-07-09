import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label="VESION home"
      className={cn('inline-flex items-baseline font-display text-xl font-bold tracking-tight', className)}
    >
      <span>VESION</span>
      <span className="text-gradient text-2xl leading-none">.</span>
    </Link>
  );
}

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { AnimatedBackground } from '@/components/marketing/hero';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <AnimatedBackground />
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo className="text-2xl" />
        </div>
        <div className="glass-light rounded-3xl p-8 shadow-glass">{children}</div>
        <p className="mt-6 text-center text-sm text-[rgb(var(--muted))]">
          <Link href="/" className="hover:text-brand-500">
            ← Back to vesion.dev
          </Link>
        </p>
      </div>
    </div>
  );
}

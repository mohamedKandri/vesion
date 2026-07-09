'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

interface LoginValues {
  email: string;
  password: string;
  twoFactorCode?: string;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useAuth((s) => s.login);
  const { error } = useToast();
  const [needs2fa, setNeeds2fa] = useState(false);
  const { register, handleSubmit, formState } = useForm<LoginValues>();

  async function onSubmit(values: LoginValues) {
    try {
      const result = await login(values.email, values.password, values.twoFactorCode);
      if (result.twoFactorRequired) {
        setNeeds2fa(true);
        return;
      }
      const next = params.get('next');
      const isStaff = result.user && ['ADMIN', 'MANAGER', 'DEVELOPER'].includes(result.user.role);
      router.replace(next ?? (isStaff ? '/admin' : '/dashboard'));
    } catch (err) {
      error('Sign in failed', (err as Error).message);
    }
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">Sign in to your VESION account.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={formState.errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            error={formState.errors.password?.message}
            {...register('password', { required: 'Password is required' })}
          />
          <p className="mt-1.5 text-right">
            <Link href="/forgot-password" className="text-xs font-medium text-brand-500 hover:underline">
              Forgot password?
            </Link>
          </p>
        </div>

        {needs2fa && (
          <Input
            label="Two-factor code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            autoComplete="one-time-code"
            hint="Enter the 6-digit code from your authenticator app."
            {...register('twoFactorCode', { required: needs2fa })}
          />
        )}

        <Button type="submit" className="w-full" size="lg" loading={formState.isSubmitting}>
          {needs2fa ? 'Verify & sign in' : 'Sign in'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[rgb(var(--muted))]">
        No account yet?{' '}
        <Link href="/register" className="font-semibold text-brand-500 hover:underline">
          Create one
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

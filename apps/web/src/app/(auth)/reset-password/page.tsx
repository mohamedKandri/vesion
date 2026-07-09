'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const { register, handleSubmit, formState, watch } = useForm<{ password: string; confirm: string }>();
  const [done, setDone] = useState(false);
  const { error } = useToast();

  async function onSubmit(values: { password: string }) {
    try {
      await api.post('/auth/reset-password', { token, password: values.password }, { anonymous: true });
      setDone(true);
    } catch (err) {
      error('Reset failed', (err as Error).message);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Invalid link</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          This reset link is missing its token. Request a new one.
        </p>
        <Link href="/forgot-password" className="mt-6 inline-block">
          <Button variant="outline">Request new link</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-4xl" aria-hidden="true">
          ✅
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold">Password updated</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          All other sessions have been signed out for safety.
        </p>
        <Link href="/login" className="mt-6 inline-block">
          <Button>Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 10 characters with uppercase, lowercase, and a digit."
          error={formState.errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 10, message: 'At least 10 characters' },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
              message: 'Needs uppercase, lowercase, and a digit',
            },
          })}
        />
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={formState.errors.confirm?.message}
          {...register('confirm', {
            validate: (value) => value === watch('password') || 'Passwords do not match',
          })}
        />
        <Button type="submit" className="w-full" size="lg" loading={formState.isSubmitting}>
          Update password
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

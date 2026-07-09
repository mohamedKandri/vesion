'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState } = useForm<{ email: string }>();
  const [sent, setSent] = useState(false);
  const { error } = useToast();

  async function onSubmit(values: { email: string }) {
    try {
      await api.post('/auth/forgot-password', values, { anonymous: true });
      setSent(true);
    } catch (err) {
      error('Request failed', (err as Error).message);
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <p className="text-4xl" aria-hidden="true">
          🔑
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold">Check your inbox</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          If an account exists for that address, a reset link is on its way. It expires in one
          hour.
        </p>
        <Link href="/login" className="mt-6 inline-block">
          <Button variant="outline">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Reset your password</h1>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
        Enter your email and we'll send a secure reset link.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={formState.errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />
        <Button type="submit" className="w-full" size="lg" loading={formState.isSubmitting}>
          Send reset link
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-[rgb(var(--muted))]">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-brand-500 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

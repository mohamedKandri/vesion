'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

interface RegisterValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName?: string;
}

export default function RegisterPage() {
  const { register, handleSubmit, formState } = useForm<RegisterValues>();
  const [done, setDone] = useState(false);
  const { error } = useToast();

  async function onSubmit(values: RegisterValues) {
    try {
      await api.post('/auth/register', values, { anonymous: true });
      setDone(true);
    } catch (err) {
      error('Registration failed', (err as Error).message);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-4xl" aria-hidden="true">
          📬
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold">Check your inbox</h1>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          We sent a verification link to your email. Click it to activate your account, then sign
          in.
        </p>
        <Link href="/login" className="mt-6 inline-block">
          <Button variant="outline">Go to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
        Follow your projects, invoices, and support in one place.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            autoComplete="given-name"
            error={formState.errors.firstName?.message}
            {...register('firstName', { required: 'Required' })}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            error={formState.errors.lastName?.message}
            {...register('lastName', { required: 'Required' })}
          />
        </div>
        <Input
          label="Work email"
          type="email"
          autoComplete="email"
          error={formState.errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
          })}
        />
        <Input label="Company (optional)" autoComplete="organization" {...register('companyName')} />
        <Input
          label="Password"
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
        <Button type="submit" className="w-full" size="lg" loading={formState.isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[rgb(var(--muted))]">
        Already registered?{' '}
        <Link href="/login" className="font-semibold text-brand-500 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

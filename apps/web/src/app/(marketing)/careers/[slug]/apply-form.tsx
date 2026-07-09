'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

interface ApplyFormValues {
  name: string;
  email: string;
  phone?: string;
  coverLetter?: string;
}

export function ApplyForm({ slug, title }: { slug: string; title: string }) {
  const { register, handleSubmit, formState, reset } = useForm<ApplyFormValues>();
  const [submitted, setSubmitted] = useState(false);
  const { error } = useToast();

  async function onSubmit(values: ApplyFormValues) {
    try {
      await api.post(`/careers/postings/${slug}/apply`, values, { anonymous: true });
      setSubmitted(true);
      reset();
    } catch (err) {
      error('Application failed', (err as Error).message);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/40 bg-[rgb(var(--card))] p-8 text-center">
        <p className="text-3xl" aria-hidden="true">
          ✅
        </p>
        <h2 className="mt-3 font-display text-lg font-bold">Application received</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Thanks for applying to {title}. We review every application personally and will get back
          to you within a week.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-6"
      aria-label={`Apply for ${title}`}
    >
      <h2 className="font-display text-lg font-bold">Apply for this role</h2>
      <Input
        label="Full name"
        autoComplete="name"
        error={formState.errors.name?.message}
        {...register('name', { required: 'Your name is required', minLength: { value: 2, message: 'Too short' } })}
      />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={formState.errors.email?.message}
        {...register('email', {
          required: 'Your email is required',
          pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
        })}
      />
      <Input label="Phone (optional)" type="tel" autoComplete="tel" {...register('phone')} />
      <Textarea
        label="Why you? (optional)"
        placeholder="A few lines about relevant work you've shipped…"
        {...register('coverLetter')}
      />
      <Button type="submit" className="w-full" loading={formState.isSubmitting}>
        Submit application
      </Button>
    </form>
  );
}

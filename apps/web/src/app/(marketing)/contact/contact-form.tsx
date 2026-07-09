'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { SERVICES } from '@/content/site';

interface ContactFormValues {
  name: string;
  email: string;
  company?: string;
  service?: string;
  budget?: string;
  message: string;
}

const BUDGETS = ['< $15k', '$15k–$50k', '$50k–$100k', '$100k–$250k', '$250k+', 'Ongoing engagement'];

export function ContactForm() {
  const params = useSearchParams();
  const { register, handleSubmit, formState, reset } = useForm<ContactFormValues>({
    defaultValues: { service: params.get('plan') ? 'Ongoing engagement' : undefined },
  });
  const [submitted, setSubmitted] = useState(false);
  const { error } = useToast();

  async function onSubmit(values: ContactFormValues) {
    try {
      await api.post('/contact', values, { anonymous: true });
      setSubmitted(true);
      reset();
    } catch (err) {
      error('Could not send your message', (err as Error).message);
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-emerald-500/40 bg-[rgb(var(--card))] p-12 text-center">
        <p className="text-4xl" aria-hidden="true">
          🎉
        </p>
        <h2 className="mt-4 font-display text-xl font-bold">Message received!</h2>
        <p className="mt-2 max-w-sm text-sm text-[rgb(var(--muted))]">
          Thanks for reaching out. A senior engineer (not a bot, not a salesperson) will reply
          within one business day.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Contact form"
      className="space-y-4 rounded-3xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Name"
          autoComplete="name"
          error={formState.errors.name?.message}
          {...register('name', { required: 'Your name is required' })}
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
      </div>
      <Input label="Company (optional)" autoComplete="organization" {...register('company')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="What do you need?" {...register('service')}>
          <option value="">Select a service…</option>
          {SERVICES.map((s) => (
            <option key={s.slug} value={s.title}>
              {s.title}
            </option>
          ))}
          <option value="Ongoing engagement">Ongoing engagement</option>
          <option value="Not sure yet">Not sure yet</option>
        </Select>
        <Select label="Budget range" {...register('budget')}>
          <option value="">Select a range…</option>
          {BUDGETS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </Select>
      </div>
      <Textarea
        label="Tell us about the project"
        placeholder="What are you building? Who is it for? What does success look like?"
        error={formState.errors.message?.message}
        {...register('message', {
          required: 'Please tell us a bit about your project',
          minLength: { value: 10, message: 'A little more detail helps us help you' },
        })}
      />
      <Button type="submit" size="lg" className="w-full" loading={formState.isSubmitting}>
        Send message →
      </Button>
      <p className="text-center text-xs text-[rgb(var(--muted))]">
        By submitting, you agree to our privacy policy. We never share your details.
      </p>
    </form>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

interface TicketFormValues {
  subject: string;
  description: string;
  priority: string;
  categoryId?: string;
}

interface TicketCategory {
  id: string;
  name: string;
}

export default function NewTicketPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const { data: categories } = useApiQuery<TicketCategory[]>(['ticket-categories'], '/tickets/categories');
  const { register, handleSubmit, formState } = useForm<TicketFormValues>({
    defaultValues: { priority: 'MEDIUM' },
  });

  async function onSubmit(values: TicketFormValues) {
    try {
      const ticket = await api.post<{ id: string }>('/tickets', {
        ...values,
        categoryId: values.categoryId || undefined,
      });
      success('Ticket created', 'Our team has been notified.');
      router.push(`/dashboard/support/${ticket.id}`);
    } catch (err) {
      error('Could not create ticket', (err as Error).message);
    }
  }

  return (
    <>
      <PageHeader title="New support ticket" description="Describe the issue and we'll take it from there." />
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Subject"
            placeholder="Short summary of the issue"
            error={formState.errors.subject?.message}
            {...register('subject', {
              required: 'A subject is required',
              minLength: { value: 5, message: 'A little more detail, please' },
            })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Category" {...register('categoryId')}>
              <option value="">Select a category…</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select label="Priority" {...register('priority')}>
              <option value="LOW">Low — question or minor issue</option>
              <option value="MEDIUM">Medium — something's off</option>
              <option value="HIGH">High — major feature impaired</option>
              <option value="URGENT">Urgent — production down</option>
            </Select>
          </div>
          <Textarea
            label="Description"
            placeholder="What happened? What did you expect? Steps to reproduce, links, and screenshots all help."
            error={formState.errors.description?.message}
            {...register('description', {
              required: 'Please describe the issue',
              minLength: { value: 10, message: 'Please add a bit more detail' },
            })}
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" loading={formState.isSubmitting}>
              Create ticket
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

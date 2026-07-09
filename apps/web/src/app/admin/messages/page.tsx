'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { Paginated, User } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { Messenger } from '@/components/features/messenger';
import { Button } from '@/components/ui/button';
import { Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

export default function AdminMessagesPage() {
  const [newOpen, setNewOpen] = useState(false);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { data: users } = useApiQuery<Paginated<User>>(['all-users'], '/users?limit=100');
  const form = useForm<{ userId: string; message: string }>();

  async function onStart(values: { userId: string; message: string }) {
    try {
      await api.post('/messages/conversations', {
        participantIds: [values.userId],
        message: values.message,
      });
      success('Conversation started');
      setNewOpen(false);
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    } catch (err) {
      error('Failed', (err as Error).message);
    }
  }

  return (
    <>
      <PageHeader
        title="Messages"
        description="Conversations with clients and the team."
        action={<Button onClick={() => setNewOpen(true)}>+ New conversation</Button>}
      />
      <Messenger />

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Start a conversation">
        <form onSubmit={form.handleSubmit(onStart)} className="space-y-4">
          <Select label="With" {...form.register('userId', { required: true })}>
            <option value="">Select a person…</option>
            {(users?.items ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} ({u.email})
              </option>
            ))}
          </Select>
          <Textarea label="First message" {...form.register('message', { required: true })} />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            Send
          </Button>
        </form>
      </Modal>
    </>
  );
}

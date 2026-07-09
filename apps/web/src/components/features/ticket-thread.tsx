'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { Ticket } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { cn, formatDateTime } from '@/lib/utils';

/**
 * Ticket conversation shared by client and admin views. Staff additionally
 * get an "internal note" toggle and the admin page passes `headerExtras`
 * (status/priority/assignee controls).
 */
export function TicketThread({
  ticketId,
  isStaff,
  headerExtras,
}: {
  ticketId: string;
  isStaff: boolean;
  headerExtras?: (ticket: Ticket) => React.ReactNode;
}) {
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const queryClient = useQueryClient();
  const { error } = useToast();

  const { data: ticket, isLoading } = useApiQuery<Ticket>(['ticket', ticketId], `/tickets/${ticketId}`);

  const send = useMutation({
    mutationFn: () => api.post(`/tickets/${ticketId}/messages`, { body: reply, isInternal: internal }),
    onSuccess: () => {
      setReply('');
      setInternal(false);
      void queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    },
    onError: (err) => error('Reply failed', (err as Error).message),
  });

  if (isLoading || !ticket) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`#${ticket.number} · ${ticket.subject}`}
        description={`Opened ${formatDateTime(ticket.createdAt)}${ticket.category ? ` · ${ticket.category.name}` : ''}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.priority} />
            <StatusBadge status={ticket.status} />
            {headerExtras?.(ticket)}
          </div>
        }
      />

      <div className="card mb-6 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Original request
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
      </div>

      <div className="space-y-4">
        {(ticket.messages ?? []).map((message) => {
          const staffAuthor = message.author.role !== 'CLIENT';
          return (
            <div
              key={message.id}
              className={cn(
                'card p-4',
                message.isInternal && 'border-amber-500/40 bg-amber-500/5',
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar
                  size="sm"
                  firstName={message.author.firstName}
                  lastName={message.author.lastName}
                  src={message.author.avatarUrl}
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {message.author.firstName} {message.author.lastName}
                    {staffAuthor && (
                      <span className="ml-2 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-500">
                        Vesion
                      </span>
                    )}
                    {message.isInternal && (
                      <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                        Internal note
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[rgb(var(--muted))]">{formatDateTime(message.createdAt)}</p>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
            </div>
          );
        })}
      </div>

      {ticket.status !== 'CLOSED' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (reply.trim()) send.mutate();
          }}
          className="card mt-6 space-y-3 p-5"
        >
          <Textarea
            label="Reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply…"
            required
          />
          <div className="flex items-center justify-between">
            {isStaff ? (
              <label className="flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(e) => setInternal(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-500"
                />
                Internal note (hidden from client)
              </label>
            ) : (
              <span />
            )}
            <Button type="submit" loading={send.isPending} disabled={!reply.trim()}>
              Send reply
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-6 rounded-xl bg-black/5 p-4 text-center text-sm text-[rgb(var(--muted))] dark:bg-white/5">
          This ticket is closed. Open a new ticket if you need further help.
        </p>
      )}
    </>
  );
}

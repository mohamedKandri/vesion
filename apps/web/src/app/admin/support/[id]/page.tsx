'use client';

import { useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { Paginated, User } from '@/lib/types';
import { TicketThread } from '@/components/features/ticket-thread';
import { Select } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_ON_CLIENT', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function AdminTicketPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { error } = useToast();
  const { data: staff } = useApiQuery<Paginated<User>>(['staff-all'], '/users?limit=100');

  const update = useMutation({
    mutationFn: (patch: Record<string, string | null>) => api.patch(`/tickets/${params.id}`, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ticket', params.id] }),
    onError: (err) => error('Update failed', (err as Error).message),
  });

  return (
    <TicketThread
      ticketId={params.id}
      isStaff
      headerExtras={(ticket) => (
        <div className="flex flex-wrap gap-2">
          <Select
            aria-label="Status"
            value={ticket.status}
            onChange={(e) => update.mutate({ status: e.target.value })}
            className="!h-8 !w-40 !py-1 text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Priority"
            value={ticket.priority}
            onChange={(e) => update.mutate({ priority: e.target.value })}
            className="!h-8 !w-28 !py-1 text-xs"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Assignee"
            value={ticket.assignee?.id ?? ''}
            onChange={(e) => update.mutate({ assigneeId: e.target.value || null })}
            className="!h-8 !w-40 !py-1 text-xs"
          >
            <option value="">Unassigned</option>
            {(staff?.items ?? [])
              .filter((u) => u.role !== 'CLIENT')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
          </Select>
        </div>
      )}
    />
  );
}

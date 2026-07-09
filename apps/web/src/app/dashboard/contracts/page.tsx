'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { Contract } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Markdown } from '@/components/markdown';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';

export default function ClientContractsPage() {
  const [selected, setSelected] = useState<Contract | null>(null);
  const [signature, setSignature] = useState('');
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { data: contracts, isLoading } = useApiQuery<Contract[]>(['contracts'], '/contracts');

  const sign = useMutation({
    mutationFn: (id: string) => api.post(`/contracts/${id}/sign`, { signedByName: signature }),
    onSuccess: () => {
      success('Contract signed', 'A copy is stored in your dashboard.');
      setSelected(null);
      setSignature('');
      void queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (err) => error('Signing failed', (err as Error).message),
  });

  return (
    <>
      <PageHeader title="Contracts" description="Agreements between your company and Vesion." />

      {isLoading ? (
        <TableSkeleton />
      ) : (contracts?.length ?? 0) === 0 ? (
        <EmptyState title="No contracts yet" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contracts!.map((contract) => (
            <button
              key={contract.id}
              onClick={() => setSelected(contract)}
              className="card p-5 text-left transition hover:border-brand-500/50"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold">{contract.title}</p>
                <StatusBadge status={contract.status} />
              </div>
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                {contract.project ? `${contract.project.name} · ` : ''}
                {contract.signedAt
                  ? `Signed ${formatDate(contract.signedAt)} by ${contract.signedByName}`
                  : contract.expiresAt
                    ? `Expires ${formatDate(contract.expiresAt)}`
                    : `Created ${formatDate(contract.createdAt)}`}
              </p>
            </button>
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        className="max-w-2xl"
      >
        {selected && (
          <div>
            <div className="max-h-[45vh] overflow-y-auto rounded-xl border border-[rgb(var(--card-border))] p-4 scrollbar-thin">
              <Markdown content={selected.body} />
            </div>

            {selected.status === 'SENT' ? (
              <form
                className="mt-5 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  sign.mutate(selected.id);
                }}
              >
                <Input
                  label="Sign by typing your full legal name"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="e.g. Emma de Vries"
                  required
                  minLength={3}
                />
                <p className="text-xs text-[rgb(var(--muted))]">
                  By signing you agree to the terms above. Your name and a timestamp are recorded as
                  your electronic signature.
                </p>
                <Button type="submit" className="w-full" loading={sign.isPending} disabled={signature.trim().length < 3}>
                  Sign contract
                </Button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-[rgb(var(--muted))]">
                Status: <StatusBadge status={selected.status} />
                {selected.signedAt &&
                  ` — signed ${formatDate(selected.signedAt)} by ${selected.signedByName}`}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

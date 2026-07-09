'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Invoice } from '@/lib/types';
import { InvoiceDetail } from '@/components/features/invoice-detail';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

export default function AdminInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const [payOpen, setPayOpen] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const payForm = useForm<{ amount: string; method: string; reference?: string }>({
    defaultValues: { method: 'BANK_TRANSFER' },
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['invoice', params.id] });
    void queryClient.invalidateQueries({ queryKey: ['admin-invoices'] });
  };

  const send = useMutation({
    mutationFn: () => api.post(`/invoices/${params.id}/send`),
    onSuccess: () => {
      success('Invoice sent to the client');
      invalidate();
    },
    onError: (err) => error('Send failed', (err as Error).message),
  });

  const voidInvoice = useMutation({
    mutationFn: () => api.post(`/invoices/${params.id}/void`),
    onSuccess: () => {
      success('Invoice voided');
      invalidate();
    },
    onError: (err) => error('Void failed', (err as Error).message),
  });

  async function recordPayment(values: { amount: string; method: string; reference?: string }) {
    if (!invoice) return;
    try {
      await api.post('/payments', {
        companyId: invoice.company!.id,
        invoiceId: invoice.id,
        amount: Number(values.amount),
        method: values.method,
        reference: values.reference || undefined,
      });
      success('Payment recorded');
      setPayOpen(false);
      payForm.reset({ method: 'BANK_TRANSFER' });
      invalidate();
    } catch (err) {
      error('Recording failed', (err as Error).message);
    }
  }

  return (
    <>
      <InvoiceDetail
        invoiceId={params.id}
        actions={(inv) => {
          // Capture the latest invoice for the payment modal — deferred so we
          // never set state during the child's render.
          if (invoice?.id !== inv.id || invoice.amountPaid !== inv.amountPaid) {
            queueMicrotask(() => setInvoice(inv));
          }
          return (
            <div className="flex gap-2">
              {inv.status === 'DRAFT' && (
                <Button size="sm" onClick={() => send.mutate()} loading={send.isPending}>
                  Send to client
                </Button>
              )}
              {['SENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(inv.status) && (
                <Button size="sm" onClick={() => setPayOpen(true)}>
                  Record payment
                </Button>
              )}
              {!['PAID', 'VOID'].includes(inv.status) && (
                <Button size="sm" variant="outline" onClick={() => voidInvoice.mutate()}>
                  Void
                </Button>
              )}
            </div>
          );
        }}
      />

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Record a payment">
        <form onSubmit={payForm.handleSubmit(recordPayment)} className="space-y-4">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            min="0.01"
            hint={
              invoice
                ? `Outstanding: ${(Number(invoice.total) - Number(invoice.amountPaid)).toFixed(2)} ${invoice.currency}`
                : undefined
            }
            {...payForm.register('amount', { required: true, min: 0.01 })}
          />
          <Select label="Method" {...payForm.register('method')}>
            <option value="BANK_TRANSFER">Bank transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHECK">Check</option>
            <option value="CARD_OFFLINE">Card (offline)</option>
            <option value="OTHER">Other</option>
          </Select>
          <Input label="Reference (bank statement id…)" {...payForm.register('reference')} />
          <Button type="submit" className="w-full" loading={payForm.formState.isSubmitting}>
            Record payment
          </Button>
        </form>
      </Modal>
    </>
  );
}

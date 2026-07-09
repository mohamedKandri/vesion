'use client';

import { useApiQuery } from '@/lib/hooks';
import type { Invoice } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatMoney, humanize } from '@/lib/utils';

/** Shared invoice detail (client + admin). Admin passes `actions` for
 * send/void/record-payment controls. */
export function InvoiceDetail({
  invoiceId,
  actions,
}: {
  invoiceId: string;
  actions?: (invoice: Invoice) => React.ReactNode;
}) {
  const { data: invoice, isLoading } = useApiQuery<Invoice>(['invoice', invoiceId], `/invoices/${invoiceId}`);

  if (isLoading || !invoice) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const outstanding = Number(invoice.total) - Number(invoice.amountPaid);

  return (
    <>
      <PageHeader
        title={invoice.number}
        description={`Issued ${formatDate(invoice.issueDate)} · Due ${formatDate(invoice.dueDate)}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status} className="text-sm" />
            {actions?.(invoice)}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Line items" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--card-border))] text-left text-xs uppercase tracking-wide text-[rgb(var(--muted))]">
                  <th scope="col" className="py-2 pr-4">Description</th>
                  <th scope="col" className="py-2 pr-4 text-right">Qty</th>
                  <th scope="col" className="py-2 pr-4 text-right">Unit price</th>
                  <th scope="col" className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item) => (
                  <tr key={item.id} className="border-b border-[rgb(var(--card-border))] last:border-0">
                    <td className="py-3 pr-4">{item.description}</td>
                    <td className="py-3 pr-4 text-right">{Number(item.quantity)}</td>
                    <td className="py-3 pr-4 text-right">{formatMoney(item.unitPrice, invoice.currency)}</td>
                    <td className="py-3 text-right font-medium">{formatMoney(item.amount, invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="ml-auto mt-6 w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[rgb(var(--muted))]">Subtotal</dt>
              <dd>{formatMoney(invoice.subtotal, invoice.currency)}</dd>
            </div>
            {Number(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-emerald-500">
                <dt>Discount</dt>
                <dd>-{formatMoney(invoice.discountAmount, invoice.currency)}</dd>
              </div>
            )}
            {invoice.taxRate && (
              <div className="flex justify-between">
                <dt className="text-[rgb(var(--muted))]">{invoice.taxRate.name}</dt>
                <dd>{formatMoney(invoice.taxAmount, invoice.currency)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-[rgb(var(--card-border))] pt-2 font-display text-base font-bold">
              <dt>Total</dt>
              <dd>{formatMoney(invoice.total, invoice.currency)}</dd>
            </div>
            {Number(invoice.amountPaid) > 0 && (
              <>
                <div className="flex justify-between text-emerald-500">
                  <dt>Paid</dt>
                  <dd>-{formatMoney(invoice.amountPaid, invoice.currency)}</dd>
                </div>
                <div className="flex justify-between font-semibold">
                  <dt>Balance due</dt>
                  <dd>{formatMoney(outstanding, invoice.currency)}</dd>
                </div>
              </>
            )}
          </dl>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Details" />
            <dl className="space-y-3 text-sm">
              {invoice.company && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Billed to</dt>
                  <dd className="mt-0.5 font-medium">{invoice.company.name}</dd>
                </div>
              )}
              {invoice.project && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Project</dt>
                  <dd className="mt-0.5 font-medium">{invoice.project.name}</dd>
                </div>
              )}
              {invoice.notes && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Notes</dt>
                  <dd className="mt-0.5 text-[rgb(var(--muted))]">{invoice.notes}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <CardHeader title="Payments" />
            {(invoice.payments?.length ?? 0) === 0 ? (
              <p className="text-sm text-[rgb(var(--muted))]">
                No payments recorded yet. Payment instructions: bank transfer to the account listed
                on the invoice PDF, using <strong>{invoice.number}</strong> as the reference.
              </p>
            ) : (
              <ul className="space-y-3">
                {invoice.payments!.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between rounded-xl border border-[rgb(var(--card-border))] p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{formatMoney(payment.amount, invoice.currency)}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {humanize(payment.method)} · {formatDate(payment.paidAt)}
                      </p>
                    </div>
                    <StatusBadge status={payment.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

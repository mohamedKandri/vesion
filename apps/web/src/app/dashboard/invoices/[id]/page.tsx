'use client';

import { useParams } from 'next/navigation';
import { InvoiceDetail } from '@/components/features/invoice-detail';

export default function ClientInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  return <InvoiceDetail invoiceId={params.id} />;
}

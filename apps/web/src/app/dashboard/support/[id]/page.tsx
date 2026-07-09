'use client';

import { useParams } from 'next/navigation';
import { TicketThread } from '@/components/features/ticket-thread';

export default function ClientTicketPage() {
  const params = useParams<{ id: string }>();
  return <TicketThread ticketId={params.id} isStaff={false} />;
}

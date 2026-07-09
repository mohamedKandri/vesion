'use client';

import { PageHeader } from '@/components/dashboard/page-header';
import { Messenger } from '@/components/features/messenger';

export default function ClientMessagesPage() {
  return (
    <>
      <PageHeader title="Messages" description="Direct line to your Vesion team." />
      <Messenger />
    </>
  );
}

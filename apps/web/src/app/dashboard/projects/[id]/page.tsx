'use client';

import { useParams } from 'next/navigation';
import { ProjectDetail } from '@/components/features/project-detail';

export default function ClientProjectDetailPage() {
  const params = useParams<{ id: string }>();
  return <ProjectDetail projectId={params.id} isStaff={false} />;
}

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/lib/hooks';
import { api } from '@/lib/api';
import type { FileAsset, Milestone, Project, Task } from '@/lib/types';
import { PageHeader, StatCard } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs } from '@/components/ui/tabs';
import { Card, CardHeader } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { KanbanBoard } from './kanban-board';
import { formatDate, formatMoney, formatBytes, humanize } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

/** Shared project detail view: used by the client dashboard (read-only board)
 * and the admin dashboard (interactive board). */
export function ProjectDetail({
  projectId,
  isStaff,
  onTaskClick,
}: {
  projectId: string;
  isStaff: boolean;
  onTaskClick?: (task: Task) => void;
}) {
  const [tab, setTab] = useState('board');
  const { data: project, isLoading } = useApiQuery<Project>(['project', projectId], `/projects/${projectId}`);

  if (isLoading || !project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={project.name}
        description={project.description ?? undefined}
        action={<StatusBadge status={project.status} className="text-sm" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Progress" value={`${project.progress}%`} icon="◔" />
        <StatCard label="Tasks" value={project._count?.tasks ?? 0} icon="▤" />
        <StatCard label="Start" value={formatDate(project.startDate)} icon="▶" />
        <StatCard
          label={isStaff ? 'Budget' : 'Target date'}
          value={
            isStaff && project.budget
              ? formatMoney(project.budget, project.currency)
              : formatDate(project.dueDate)
          }
          icon={isStaff ? '◇' : '◷'}
        />
      </div>

      <div className="mt-4">
        <Progress value={project.progress} label="Project progress" />
      </div>

      <div className="mt-6">
        <Tabs
          tabs={[
            { id: 'board', label: 'Board' },
            { id: 'milestones', label: 'Milestones', count: project.milestones?.length },
            { id: 'timeline', label: 'Timeline' },
            { id: 'team', label: 'Team', count: project.members?.length },
            { id: 'files', label: 'Files' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mt-6">
        {tab === 'board' && (
          <KanbanBoard projectId={projectId} readOnly={!isStaff} onTaskClick={onTaskClick} />
        )}
        {tab === 'milestones' && <MilestonesList milestones={project.milestones ?? []} />}
        {tab === 'timeline' && <ProjectTimeline projectId={projectId} />}
        {tab === 'team' && <TeamList project={project} />}
        {tab === 'files' && <ProjectFiles projectId={projectId} />}
      </div>
    </>
  );
}

function MilestonesList({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) return <EmptyState title="No milestones defined yet" />;
  return (
    <ol className="relative space-y-6 border-l-2 border-[rgb(var(--card-border))] pl-6">
      {milestones.map((m) => (
        <li key={m.id} className="relative">
          <span
            aria-hidden="true"
            className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-2 border-[rgb(var(--background))] ${
              m.status === 'COMPLETED'
                ? 'bg-emerald-500'
                : m.status === 'IN_PROGRESS'
                  ? 'bg-brand-500'
                  : 'bg-[rgb(var(--card-border))]'
            }`}
          />
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-semibold">{m.title}</p>
            <StatusBadge status={m.status} />
          </div>
          {m.description && <p className="mt-1 text-sm text-[rgb(var(--muted))]">{m.description}</p>}
          {m.dueDate && (
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">Due {formatDate(m.dueDate)}</p>
          )}
        </li>
      ))}
    </ol>
  );
}

interface TimelineData {
  milestones: Milestone[];
  tasks: Pick<Task, 'id' | 'title' | 'status' | 'priority' | 'dueDate' | 'milestone'>[] & Task[];
}

function ProjectTimeline({ projectId }: { projectId: string }) {
  const { data, isLoading } = useApiQuery<TimelineData>(
    ['project-timeline', projectId],
    `/projects/${projectId}/timeline`,
  );
  if (isLoading) return <Skeleton className="h-64" />;
  if (!data) return null;

  const dated = data.tasks.filter((t) => t.dueDate);
  if (dated.length === 0 && data.milestones.length === 0) {
    return <EmptyState title="Nothing scheduled yet" />;
  }

  const events = [
    ...data.milestones
      .filter((m) => m.dueDate)
      .map((m) => ({ id: m.id, date: m.dueDate!, label: m.title, kind: 'Milestone', status: m.status })),
    ...dated.map((t) => ({ id: t.id, date: t.dueDate!, label: t.title, kind: 'Task', status: t.status })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <Card>
      <CardHeader title="Upcoming schedule" description="Milestones and dated tasks in order." />
      <ol className="space-y-3">
        {events.map((event) => (
          <li
            key={`${event.kind}-${event.id}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgb(var(--card-border))] p-3"
          >
            <span className="w-24 shrink-0 text-sm font-semibold">{formatDate(event.date)}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                event.kind === 'Milestone'
                  ? 'bg-accent-500/15 text-accent-500'
                  : 'bg-brand-500/10 text-brand-500'
              }`}
            >
              {event.kind}
            </span>
            <span className="flex-1 text-sm">{event.label}</span>
            <StatusBadge status={event.status} />
          </li>
        ))}
      </ol>
    </Card>
  );
}

function TeamList({ project }: { project: Project }) {
  const members = project.members ?? [];
  if (members.length === 0) return <EmptyState title="No team members assigned" />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-4"
        >
          <Avatar
            firstName={member.user.firstName}
            lastName={member.user.lastName}
            src={member.user.avatarUrl}
            size="lg"
          />
          <div>
            <p className="font-semibold">
              {member.user.firstName} {member.user.lastName}
            </p>
            <p className="text-sm text-[rgb(var(--muted))]">{member.roleTitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectFiles({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [uploading, setUploading] = useState(false);
  const { data: files, isLoading } = useApiQuery<FileAsset[]>(
    ['project-files', projectId],
    `/files/project/${projectId}`,
  );

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('projectId', projectId);
      await api.upload('/files/upload', form);
      success('File uploaded', file.name);
      void queryClient.invalidateQueries({ queryKey: ['project-files', projectId] });
    } catch (err) {
      error('Upload failed', (err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function download(file: FileAsset) {
    try {
      const token = (await import('@/lib/api')).tokenStore.getAccess();
      const res = await fetch(`${api.url}/files/${file.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      error('Download failed', (err as Error).message);
    }
  }

  if (isLoading) return <Skeleton className="h-48" />;

  return (
    <Card>
      <CardHeader
        title="Shared files"
        description="Deliverables, documents, and assets for this project."
        action={
          <label className="cursor-pointer">
            <span className="sr-only">Upload a file</span>
            <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
            <Button size="sm" loading={uploading} onClick={(e) => {
              (e.currentTarget.parentElement?.querySelector('input[type=file]') as HTMLInputElement)?.click();
            }}>
              ↑ Upload
            </Button>
          </label>
        }
      />
      {(files?.length ?? 0) === 0 ? (
        <EmptyState title="No files yet" description="Upload the first file for this project." />
      ) : (
        <ul className="divide-y divide-[rgb(var(--card-border))]">
          {files!.map((file) => (
            <li key={file.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {formatBytes(file.size)} · {humanize(file.mimeType.split('/')[1] ?? file.mimeType)} ·{' '}
                  {file.uploader ? `${file.uploader.firstName} ${file.uploader.lastName}` : 'Unknown'} ·{' '}
                  {formatDate(file.createdAt)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => download(file)}>
                Download
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

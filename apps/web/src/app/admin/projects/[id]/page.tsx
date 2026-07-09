'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import type { Paginated, Task, User } from '@/lib/types';
import { ProjectDetail } from '@/components/features/project-detail';
import { Button } from '@/components/ui/button';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/lib/utils';

export default function AdminProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const { data: staff } = useApiQuery<Paginated<User>>(['staff-all'], '/users?limit=100');
  const createForm = useForm<Record<string, string>>({ defaultValues: { priority: 'MEDIUM' } });

  async function onCreateTask(values: Record<string, string>) {
    try {
      await api.post('/tasks', {
        projectId: params.id,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        assigneeId: values.assigneeId || undefined,
        dueDate: values.dueDate || undefined,
        labels: values.labels ? values.labels.split(',').map((l) => l.trim()).filter(Boolean) : undefined,
      });
      success('Task created');
      setCreateOpen(false);
      createForm.reset({ priority: 'MEDIUM' });
      void queryClient.invalidateQueries({ queryKey: ['board', params.id] });
      void queryClient.invalidateQueries({ queryKey: ['project', params.id] });
    } catch (err) {
      error('Create failed', (err as Error).message);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>+ New task</Button>
      </div>

      <ProjectDetail projectId={params.id} isStaff onTaskClick={(task) => setActiveTaskId(task.id)} />

      {/* Create task */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New task" className="max-w-xl">
        <form onSubmit={createForm.handleSubmit(onCreateTask)} className="space-y-4">
          <Input label="Title" {...createForm.register('title', { required: true })} />
          <Textarea label="Description" {...createForm.register('description')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Priority" {...createForm.register('priority')}>
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
            <Select label="Assignee" {...createForm.register('assigneeId')}>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Due date" type="date" {...createForm.register('dueDate')} />
            <Input label="Labels (comma separated)" placeholder="frontend, urgent" {...createForm.register('labels')} />
          </div>
          <Button type="submit" className="w-full" loading={createForm.formState.isSubmitting}>
            Create task
          </Button>
        </form>
      </Modal>

      {activeTaskId && (
        <TaskModal taskId={activeTaskId} projectId={params.id} onClose={() => setActiveTaskId(null)} />
      )}
    </>
  );
}

function TaskModal({
  taskId,
  projectId,
  onClose,
}: {
  taskId: string;
  projectId: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { error } = useToast();
  const [comment, setComment] = useState('');
  const [minutes, setMinutes] = useState('');

  const { data: task } = useApiQuery<Task>(['task', taskId], `/tasks/${taskId}`);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    void queryClient.invalidateQueries({ queryKey: ['board', projectId] });
  };

  const addComment = useMutation({
    mutationFn: () => api.post(`/tasks/${taskId}/comments`, { body: comment }),
    onSuccess: () => {
      setComment('');
      invalidate();
    },
    onError: (err) => error('Comment failed', (err as Error).message),
  });

  const logTime = useMutation({
    mutationFn: () =>
      api.post(`/tasks/${taskId}/time`, {
        minutes: Number(minutes),
        date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => {
      setMinutes('');
      invalidate();
    },
    onError: (err) => error('Time log failed', (err as Error).message),
  });

  const totalMinutes = (task?.timeEntries ?? []).reduce((sum, e) => sum + e.minutes, 0);

  return (
    <Modal open onClose={onClose} title={task?.title ?? 'Task'} className="max-w-xl">
      {task && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <StatusBadge status={task.priority} />
            {task.assignee && (
              <span className="flex items-center gap-1.5 text-sm text-[rgb(var(--muted))]">
                <Avatar
                  size="sm"
                  firstName={task.assignee.firstName}
                  lastName={task.assignee.lastName}
                  src={task.assignee.avatarUrl}
                />
                {task.assignee.firstName} {task.assignee.lastName}
              </span>
            )}
            {totalMinutes > 0 && (
              <span className="text-sm text-[rgb(var(--muted))]">
                ⏱ {(totalMinutes / 60).toFixed(1)}h logged
              </span>
            )}
          </div>

          {task.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[rgb(var(--muted))]">
              {task.description}
            </p>
          )}

          <div className="flex items-end gap-2">
            <Input
              label="Log time (minutes)"
              type="number"
              min="1"
              max="1440"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="max-w-40"
            />
            <Button
              variant="outline"
              onClick={() => logTime.mutate()}
              loading={logTime.isPending}
              disabled={!minutes || Number(minutes) < 1}
            >
              Log
            </Button>
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold">Comments ({task.comments?.length ?? 0})</p>
            <div className="max-h-48 space-y-3 overflow-y-auto scrollbar-thin">
              {(task.comments ?? []).map((c) => (
                <div key={c.id} className="rounded-xl bg-black/5 p-3 dark:bg-white/5">
                  <p className="text-xs font-semibold">
                    {c.author.firstName} {c.author.lastName}
                    <span className="ml-2 font-normal text-[rgb(var(--muted))]">
                      {formatDateTime(c.createdAt)}
                    </span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) addComment.mutate();
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment…"
                aria-label="Write a comment"
                className="h-10 flex-1 rounded-xl border border-[rgb(var(--card-border))] bg-transparent px-3 text-sm placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none"
              />
              <Button type="submit" size="sm" loading={addComment.isPending} disabled={!comment.trim()}>
                Send
              </Button>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
}

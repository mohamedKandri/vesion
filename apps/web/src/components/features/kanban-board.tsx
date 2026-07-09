'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Task, TaskStatus } from '@/lib/types';
import { StatusBadge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { cn, formatDate, humanize } from '@/lib/utils';

const COLUMNS: TaskStatus[] = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

type Board = Record<TaskStatus, Task[]>;

/**
 * Kanban board with native HTML5 drag-and-drop. `readOnly` renders the same
 * board for clients without move permissions.
 */
export function KanbanBoard({
  projectId,
  readOnly = false,
  onTaskClick,
}: {
  projectId: string;
  readOnly?: boolean;
  onTaskClick?: (task: Task) => void;
}) {
  const queryClient = useQueryClient();
  const { error } = useToast();

  const { data: board, isLoading } = useQuery<Board>({
    queryKey: ['board', projectId],
    queryFn: () => api.get(`/tasks/board/${projectId}`),
  });

  const move = useMutation({
    mutationFn: ({ taskId, status, order }: { taskId: string; status: TaskStatus; order: number }) =>
      api.patch(`/tasks/${taskId}/move`, { status, order }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['board', projectId] });
      const previous = queryClient.getQueryData<Board>(['board', projectId]);
      if (previous) {
        const next: Board = { BACKLOG: [], TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };
        let moved: Task | undefined;
        for (const col of COLUMNS) {
          next[col] = previous[col].filter((t) => {
            if (t.id === taskId) {
              moved = t;
              return false;
            }
            return true;
          });
        }
        if (moved) next[status] = [...next[status], { ...moved, status }];
        queryClient.setQueryData(['board', projectId], next);
      }
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['board', projectId], context.previous);
      error('Could not move task', (err as Error).message);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['board', projectId] }),
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-5">
        {COLUMNS.map((col) => (
          <Skeleton key={col} className="h-64" />
        ))}
      </div>
    );
  }
  if (!board) return null;

  return (
    <div className="grid gap-4 overflow-x-auto pb-2 lg:grid-cols-5">
      {COLUMNS.map((column) => (
        <div
          key={column}
          onDragOver={readOnly ? undefined : (e) => e.preventDefault()}
          onDrop={
            readOnly
              ? undefined
              : (e) => {
                  e.preventDefault();
                  const taskId = e.dataTransfer.getData('text/task-id');
                  if (taskId) move.mutate({ taskId, status: column, order: board[column].length });
                }
          }
          className="min-w-56 rounded-2xl border border-[rgb(var(--card-border))] bg-black/[0.02] p-3 dark:bg-white/[0.02]"
          aria-label={`${humanize(column)} column, ${board[column].length} tasks`}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--muted))]">
              {humanize(column)}
            </p>
            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold dark:bg-white/10">
              {board[column].length}
            </span>
          </div>
          <div className="space-y-2">
            {board[column].map((task) => (
              <div
                key={task.id}
                draggable={!readOnly}
                onDragStart={(e) => e.dataTransfer.setData('text/task-id', task.id)}
                onClick={onTaskClick ? () => onTaskClick(task) : undefined}
                role={onTaskClick ? 'button' : undefined}
                className={cn(
                  'rounded-xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-3 transition',
                  !readOnly && 'cursor-grab active:cursor-grabbing',
                  onTaskClick && 'hover:border-brand-500/50',
                )}
              >
                <p className="text-sm font-medium leading-snug">{task.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={task.priority} />
                  {task.labels.slice(0, 2).map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium dark:bg-white/10"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[rgb(var(--muted))]">
                    {task.dueDate ? formatDate(task.dueDate) : ''}
                  </span>
                  {task.assignee && (
                    <Avatar
                      size="sm"
                      firstName={task.assignee.firstName}
                      lastName={task.assignee.lastName}
                      src={task.assignee.avatarUrl}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

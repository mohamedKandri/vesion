'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Notification, Paginated } from '@/lib/types';
import { timeAgo, cn } from '@/lib/utils';

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery<Paginated<Notification> & { unread: number }>({
    queryKey: ['notifications', 'bell'],
    queryFn: () => api.get('/notifications?limit=8'),
    refetchInterval: 30_000,
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unread = data?.unread ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(var(--card-border))] transition hover:bg-black/5 dark:hover:bg-white/10"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gradient px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              aria-label="Close notifications"
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className="absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] shadow-glass"
            >
              <div className="flex items-center justify-between border-b border-[rgb(var(--card-border))] px-4 py-3">
                <p className="text-sm font-bold">Notifications</p>
                {unread > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="text-xs font-medium text-brand-500 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto scrollbar-thin">
                {(data?.items ?? []).length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-[rgb(var(--muted))]">
                    You're all caught up 🎉
                  </p>
                ) : (
                  data?.items.map((n) => (
                    <Link
                      key={n.id}
                      href={n.link ?? '#'}
                      onClick={() => {
                        if (!n.readAt) markRead.mutate(n.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'block border-b border-[rgb(var(--card-border))] px-4 py-3 transition last:border-0 hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
                        !n.readAt && 'bg-brand-500/5',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.readAt && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug">{n.title}</p>
                          {n.body && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-[rgb(var(--muted))]">
                              {n.body}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-[rgb(var(--muted))]">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

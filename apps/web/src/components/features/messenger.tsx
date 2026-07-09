'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import type { Conversation } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, timeAgo } from '@/lib/utils';

/** Two-pane messenger with 5-second polling — used by client and admin dashboards. */
export function Messenger() {
  const user = useAuth((s) => s.user);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations'),
    refetchInterval: 15_000,
  });

  const { data: active } = useQuery<Conversation>({
    queryKey: ['conversation', activeId],
    queryFn: () => api.get(`/messages/conversations/${activeId}`),
    enabled: !!activeId,
    refetchInterval: 5_000,
  });

  const send = useMutation({
    mutationFn: (body: string) => api.post(`/messages/conversations/${activeId}`, { body }),
    onSuccess: () => {
      setDraft('');
      void queryClient.invalidateQueries({ queryKey: ['conversation', activeId] });
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [active?.messages?.length]);

  function conversationName(c: Conversation): string {
    if (c.subject) return c.subject;
    const others = c.participants.filter((p) => p.user.id !== user?.id);
    return others.map((p) => `${p.user.firstName} ${p.user.lastName}`).join(', ') || 'Conversation';
  }

  if (isLoading) return <Skeleton className="h-[32rem]" />;

  return (
    <div className="grid h-[calc(100vh-14rem)] min-h-[28rem] overflow-hidden rounded-2xl border border-[rgb(var(--card-border))] lg:grid-cols-[320px_1fr]">
      {/* Conversation list */}
      <div
        className={cn(
          'flex flex-col border-r border-[rgb(var(--card-border))] bg-[rgb(var(--card))]',
          activeId && 'hidden lg:flex',
        )}
      >
        <div className="border-b border-[rgb(var(--card-border))] p-4">
          <h2 className="font-display font-bold">Conversations</h2>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {(conversations?.length ?? 0) === 0 ? (
            <p className="p-6 text-sm text-[rgb(var(--muted))]">
              No conversations yet. Your Vesion team will start one when your project kicks off.
            </p>
          ) : (
            conversations!.map((c) => {
              const other = c.participants.find((p) => p.user.id !== user?.id)?.user;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b border-[rgb(var(--card-border))] p-4 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
                    activeId === c.id && 'bg-brand-500/5',
                  )}
                >
                  <Avatar firstName={other?.firstName} lastName={other?.lastName} src={other?.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{conversationName(c)}</p>
                      {(c.unread ?? 0) > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-gradient px-1.5 text-[10px] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-[rgb(var(--muted))]">
                      {c.lastMessage?.body ?? 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active thread */}
      <div className={cn('flex flex-col bg-[rgb(var(--background))]', !activeId && 'hidden lg:flex')}>
        {!active ? (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon="✉" title="Select a conversation" className="border-0" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-4">
              <button
                onClick={() => setActiveId(null)}
                className="lg:hidden"
                aria-label="Back to conversations"
              >
                ←
              </button>
              <h2 className="font-semibold">{conversationName(active)}</h2>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
              {(active.messages ?? []).map((m) => {
                const mine = m.sender?.id === user?.id;
                return (
                  <div key={m.id} className={cn('flex gap-2.5', mine ? 'justify-end' : 'justify-start')}>
                    {!mine && (
                      <Avatar
                        size="sm"
                        firstName={m.sender?.firstName}
                        lastName={m.sender?.lastName}
                        src={m.sender?.avatarUrl}
                      />
                    )}
                    <div
                      className={cn(
                        'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                        mine ? 'bg-brand-gradient text-white' : 'bg-black/5 dark:bg-white/5',
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className={cn('mt-1 text-[10px]', mine ? 'text-white/70' : 'text-[rgb(var(--muted))]')}>
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.trim()) send.mutate(draft.trim());
              }}
              className="flex gap-2 border-t border-[rgb(var(--card-border))] bg-[rgb(var(--card))] p-3"
            >
              <label htmlFor="message-input" className="sr-only">
                Type a message
              </label>
              <input
                id="message-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message…"
                className="h-10 flex-1 rounded-xl border border-[rgb(var(--card-border))] bg-transparent px-3 text-sm placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={send.isPending || !draft.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white disabled:opacity-50"
              >
                ➤
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, tokenStore } from '@/lib/api';
import type { AiConversation, AiMessage } from '@/lib/types';
import { PageHeader } from '@/components/dashboard/page-header';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Markdown } from '@/components/markdown';
import { cn, timeAgo } from '@/lib/utils';

interface DisplayMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  sources?: { title: string }[];
  streaming?: boolean;
}

export default function AssistantPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations } = useQuery<AiConversation[]>({
    queryKey: ['ai-conversations'],
    queryFn: () => api.get('/ai/conversations'),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function openConversation(id: string) {
    setActiveId(id);
    const conversation = await api.get<{ messages: AiMessage[] }>(`/ai/conversations/${id}`);
    setMessages(
      conversation.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        sources: (m.sources as { title: string }[] | null) ?? undefined,
      })),
    );
  }

  function newConversation() {
    setActiveId(null);
    setMessages([]);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'USER', content: text }]);
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: 'ASSISTANT', content: '', streaming: true }]);

    try {
      let conversationId = activeId;
      if (!conversationId) {
        const created = await api.post<{ id: string }>('/ai/conversations', { context: 'SUPPORT' });
        conversationId = created.id;
        setActiveId(created.id);
        void queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      }

      const token = tokenStore.getAccess();
      const res = await fetch(`${api.url}/ai/conversations/${conversationId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) throw new Error('The assistant is unavailable right now.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        for (const event of events) {
          const type = /^event: (\w+)/m.exec(event)?.[1];
          const data = /^data: (.+)/m.exec(event)?.[1];
          if (!type || !data) continue;
          const payload = JSON.parse(data);
          if (type === 'chunk') {
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + payload.text } : m)),
            );
          } else if (type === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, streaming: false, sources: payload.sources?.length ? payload.sources : undefined }
                  : m,
              ),
            );
          } else if (type === 'error') {
            throw new Error(payload.message);
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, streaming: false, content: m.content || `Sorry — ${(err as Error).message}` }
            : m,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="AI Assistant"
        description="Ask about your projects, invoices, tickets — or anything from the knowledge base."
        action={<Button variant="outline" onClick={newConversation}>+ New conversation</Button>}
      />

      <div className="grid h-[calc(100vh-15rem)] min-h-[26rem] gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="card hidden flex-col overflow-hidden lg:flex">
          <p className="border-b border-[rgb(var(--card-border))] p-4 text-sm font-bold">History</p>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {(conversations ?? []).length === 0 ? (
              <p className="p-4 text-sm text-[rgb(var(--muted))]">No conversations yet.</p>
            ) : (
              conversations!.map((c) => (
                <button
                  key={c.id}
                  onClick={() => void openConversation(c.id)}
                  className={cn(
                    'block w-full border-b border-[rgb(var(--card-border))] p-3.5 text-left transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]',
                    activeId === c.id && 'bg-brand-500/5',
                  )}
                >
                  <p className="truncate text-sm font-medium">{c.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{timeAgo(c.updatedAt)}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="card flex flex-col overflow-hidden !p-0">
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-thin">
            {messages.length === 0 ? (
              <EmptyState
                icon="✦"
                title="Start a conversation"
                description={'Try: "What\'s the status of my project?" or "Do I have any open invoices?"'}
                className="h-full border-0"
              />
            ) : (
              messages.map((m) => (
                <div key={m.id} className={cn('flex', m.role === 'USER' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                      m.role === 'USER' ? 'bg-brand-gradient text-white' : 'bg-black/5 dark:bg-white/5',
                    )}
                  >
                    {m.content ? (
                      <Markdown content={m.content} className="[&_p]:my-1 [&_ul]:my-1" />
                    ) : (
                      <span className="inline-flex gap-1" aria-label="Assistant is typing">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                      </span>
                    )}
                    {m.sources && (
                      <p className="mt-2 border-t border-black/10 pt-2 text-xs opacity-70 dark:border-white/10">
                        Sources: {m.sources.map((s) => s.title).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={send} className="flex gap-2 border-t border-[rgb(var(--card-border))] p-3">
            <label htmlFor="assistant-input" className="sr-only">
              Message the assistant
            </label>
            <input
              id="assistant-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything…"
              disabled={busy}
              className="h-11 flex-1 rounded-xl border border-[rgb(var(--card-border))] bg-transparent px-4 text-sm placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none"
            />
            <Button type="submit" disabled={busy || !input.trim()}>
              Send
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { api, tokenStore } from '@/lib/api';
import type { AiMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Markdown } from '@/components/markdown';

const VISITOR_KEY = 'vesion.visitorId';

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

interface DisplayMessage extends Pick<AiMessage, 'role' | 'content'> {
  id: string;
  sources?: { type: string; title: string; slug?: string }[];
  streaming?: boolean;
}

/**
 * Floating AI assistant widget: anonymous website chat with streamed (SSE)
 * responses, persisted conversation, and knowledge-base source citations.
 */
export function ChatWidget({ context = 'WEBSITE' }: { context?: 'WEBSITE' | 'SUPPORT' | 'PROJECT' | 'ADMIN' }) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [open, messages.length, scrollToBottom]);

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;
    const stored = sessionStorage.getItem(`vesion.aiConversation.${context}`);
    if (stored) {
      setConversationId(stored);
      try {
        const existing = await api.get<{ messages: AiMessage[] }>(
          `/ai/conversations/${stored}?visitorId=${getVisitorId()}`,
        );
        setMessages(
          existing.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            sources: m.sources ?? undefined,
          })),
        );
        return stored;
      } catch {
        sessionStorage.removeItem(`vesion.aiConversation.${context}`);
      }
    }
    const conversation = await api.post<{ id: string }>('/ai/conversations', {
      context,
      visitorId: getVisitorId(),
    });
    sessionStorage.setItem(`vesion.aiConversation.${context}`, conversation.id);
    setConversationId(conversation.id);
    return conversation.id;
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    setBusy(true);
    setInput('');
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'USER', content: text }]);
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: 'ASSISTANT', content: '', streaming: true }]);

    try {
      const id = await ensureConversation();
      const token = tokenStore.getAccess();
      const res = await fetch(`${api.url}/ai/conversations/${id}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, visitorId: getVisitorId() }),
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
          const typeMatch = /^event: (\w+)/m.exec(event);
          const dataMatch = /^data: (.+)/m.exec(event);
          if (!typeMatch || !dataMatch) continue;
          const payload = JSON.parse(dataMatch[1]);

          if (typeMatch[1] === 'chunk') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + payload.text } : m,
              ),
            );
            scrollToBottom();
          } else if (typeMatch[1] === 'done') {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, streaming: false, sources: payload.sources?.length ? payload.sources : undefined }
                  : m,
              ),
            );
          } else if (typeMatch[1] === 'error') {
            throw new Error(payload.message);
          }
        }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                streaming: false,
                content:
                  m.content ||
                  `Sorry — ${(err as Error).message || 'something went wrong'}. Please try again.`,
              }
            : m,
        ),
      );
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : 'Open AI assistant'}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl text-white shadow-glow transition hover:scale-105"
      >
        {open ? '✕' : '✦'}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-label="VESION AI assistant"
            className="fixed bottom-24 right-5 z-50 flex h-[520px] w-[min(400px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[rgb(var(--card-border))] bg-[rgb(var(--card))] shadow-glass"
          >
            <div className="flex items-center gap-3 border-b border-[rgb(var(--card-border))] bg-brand-gradient px-4 py-3 text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-lg">✦</span>
              <div>
                <p className="text-sm font-bold">VESION Assistant</p>
                <p className="text-xs opacity-80">Typically replies instantly</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 scrollbar-thin">
              {messages.length === 0 && (
                <div className="rounded-xl bg-black/5 p-3 text-sm dark:bg-white/5">
                  👋 Hi! Ask me about our services, pricing, process — or anything from the
                  knowledge base.
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn('flex', m.role === 'USER' ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                      m.role === 'USER'
                        ? 'bg-brand-gradient text-white'
                        : 'bg-black/5 dark:bg-white/5',
                    )}
                  >
                    {m.content ? (
                      <Markdown content={m.content} className="[&_p]:my-1 [&_ul]:my-1" />
                    ) : (
                      <span className="inline-flex gap-1" aria-label="Assistant is typing">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                      </span>
                    )}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-2 border-t border-black/10 pt-2 text-xs opacity-70 dark:border-white/10">
                        Sources: {m.sources.map((s) => s.title).join(' · ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={send} className="flex gap-2 border-t border-[rgb(var(--card-border))] p-3">
              <label htmlFor="chat-input" className="sr-only">
                Message the assistant
              </label>
              <input
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything…"
                disabled={busy}
                className="h-10 flex-1 rounded-xl border border-[rgb(var(--card-border))] bg-transparent px-3 text-sm placeholder:text-[rgb(var(--muted))] focus:border-brand-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white transition disabled:opacity-50"
              >
                ➤
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

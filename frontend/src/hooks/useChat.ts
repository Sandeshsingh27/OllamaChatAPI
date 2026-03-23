import { useState, useRef, useCallback } from 'react';
import { Message } from '../types';

// ── API URL helpers ───────────────────────────────────────────────────────────
// VITE_API_BASE_URL is empty in dev (Vite proxy handles routing to localhost:8080)
// and set to the full server URL in production.
const BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const STREAM_URL = `${BASE}${import.meta.env.VITE_STREAM_ENDPOINT ?? '/api/chat/stream'}`;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function newConversationId(): string {
  return `session-${Date.now()}`;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // conversationId is now resettable so "New Chat" can start a fresh session.
  const [conversationId, setConversationId] = useState<string>(newConversationId);
  const abortControllerRef = useRef<AbortController | null>(null);

  /** Appends a token to the last (assistant) message in state. */
  // const appendToken = useCallback((token: string) => {
  //   setMessages(prev => {
  //     const last = prev[prev.length - 1];
  //     if (last && last.role === 'assistant') {
  //       return [...prev.slice(0, -1), { ...last, content: last.content + token }];
  //     }
  //     return prev;
  //   });
  // }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMsg: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch(STREAM_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({ message: content.trim(), conversationId }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `HTTP ${response.status}`);
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Read the SSE stream chunk by chunk.
        // Spring AI emits:  data:<token>\n\n
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Events are separated by double newline.
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? ''; // keep incomplete trailing part

          for (const part of parts) {
            for (const line of part.split('\n')) {
              if (line.startsWith('data:')) {
                // "data:Hello" → "Hello"   |   "data: world" → " world"
                const token = line.slice(5);
                if (token.length > 0) {
                  setMessages(prev => {
                    const last = prev[prev.length - 1];
                    if (last && last.role === 'assistant') {
                      return [...prev.slice(0, -1), { ...last, content: last.content + token }];
                    }
                    return prev;
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        const error = err as Error;
        if (error.name !== 'AbortError') {
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last?.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content: last.content || `⚠️ ${error.message}`,
                  isStreaming: false,
                  isError: true,
                },
              ];
            }
            return prev;
          });
        }
      } finally {
        // Always clear the streaming flag when done (success, error, or abort).
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant' && last.isStreaming) {
            return [...prev.slice(0, -1), { ...last, isStreaming: false }];
          }
          return prev;
        });
        setIsLoading(false);
      }
    },
    [isLoading, conversationId],
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant' && last.isStreaming) {
        return [...prev.slice(0, -1), { ...last, isStreaming: false }];
      }
      return prev;
    });
    setIsLoading(false);
  }, []);

  /** Clears messages but keeps the same conversation ID (backend memory intact). */
  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
  }, [stopStreaming]);

  /**
   * Starts a brand-new conversation:
   * - Generates a fresh conversationId  → backend treats it as a new session.
   * - Clears all visible messages       → UI is reset to the welcome screen.
   */
  const newChat = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setConversationId(newConversationId());
  }, [stopStreaming]);

  return { messages, isLoading, conversationId, sendMessage, stopStreaming, clearMessages, newChat };
}

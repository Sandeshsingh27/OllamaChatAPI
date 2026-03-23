import { useEffect, useRef } from 'react';
import { Bot, Cpu, MessageSquarePlus, Trash2 } from 'lucide-react';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { useChat } from './hooks/useChat';
import './App.css';

// Read from .env / .env.development / .env.production
const APP_TITLE  = import.meta.env.VITE_APP_TITLE  || 'OllamaChat';
const MODEL_NAME = import.meta.env.VITE_MODEL_NAME || 'mistral';

const SUGGESTIONS = [
  'Explain quantum computing simply',
  'Write a short poem about space',
  'What are the benefits of meditation?',
  'Tell me a surprising fun fact',
];

function App() {
  const { messages, isLoading, conversationId, sendMessage, stopStreaming, clearMessages, newChat } =
    useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="app">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="header">
        <div className="header-logo">
          <Bot size={20} />
        </div>

        <div className="header-info">
          <span className="header-title">{APP_TITLE}</span>
          <span className="header-session">
            <Cpu size={10} /> {conversationId}
          </span>
        </div>

        <span className="header-badge">{MODEL_NAME}</span>

        {/* Clear — only shown when there are messages; keeps same conversationId */}
        {messages.length > 0 && (
          <button className="header-btn header-btn--ghost" onClick={clearMessages} title="Clear messages">
            <Trash2 size={14} />
            Clear
          </button>
        )}

        {/* New Chat — always visible; starts a completely fresh session */}
        <button className="header-btn header-btn--primary" onClick={newChat} title="Start a new conversation">
          <MessageSquarePlus size={14} />
          New Chat
        </button>
      </header>

      {/* ── Messages ───────────────────────────────────── */}
      <main className="messages-area">
        {messages.length === 0 ? (
          <div className="welcome">
            <div className="welcome-icon">
              <Bot size={34} />
            </div>
            <h2>How can I help you today?</h2>
            <p>
              Chat with <strong>{MODEL_NAME}</strong> running locally via Ollama.
              <br />
              Your conversation history is kept across messages in this session.
            </p>
            <div className="suggestions">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className="suggestion"
                  onClick={() => sendMessage(s)}
                  disabled={isLoading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {/* ── Input ──────────────────────────────────────── */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} onStop={stopStreaming} />
    </div>
  );
}

export default App;


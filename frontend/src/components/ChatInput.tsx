import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import styles from './ChatInput.module.css';

interface Props {
  onSend: (message: string) => void;
  isLoading: boolean;
  onStop: () => void;
}

export const ChatInput: React.FC<Props> = ({ onSend, isLoading, onStop }) => {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as the user types
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend(value.trim());
      setValue('');
      // Reset height after clearing
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.area}>
      <div className={styles.wrapper}>
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Ollama… (Enter ↵ to send, Shift+Enter for new line)"
          rows={1}
        />

        <button
          className={`${styles.btn} ${isLoading ? styles.stop : ''}`}
          onClick={isLoading ? onStop : handleSend}
          disabled={!isLoading && !value.trim()}
          title={isLoading ? 'Stop generating' : 'Send message'}
        >
          {isLoading ? <Square size={17} /> : <Send size={17} />}
        </button>
      </div>

      <p className={styles.hint}>
        <kbd>Enter</kbd> to send &nbsp;·&nbsp; <kbd>Shift + Enter</kbd> for new line
      </p>
    </div>
  );
};


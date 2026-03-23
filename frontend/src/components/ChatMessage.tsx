import React from 'react';
import { Bot, User } from 'lucide-react';
import { Message } from '../types';
import styles from './ChatMessage.module.css';

interface Props {
  message: Message;
}

export const ChatMessage: React.FC<Props> = ({ message }) => {
  const isUser = message.role === 'user';
  const time = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`${styles.message} ${isUser ? styles.user : styles.assistant}`}>
      <div className={styles.avatar}>
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      <div className={styles.body}>
        <div
          className={`${styles.bubble} ${message.isError ? styles.error : ''}`}
        >
          {message.content}
          {message.isStreaming && <span className={styles.cursor} aria-hidden />}
        </div>
        <span className={styles.time}>{time}</span>
      </div>
    </div>
  );
};


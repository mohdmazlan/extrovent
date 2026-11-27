import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../lib/apiClient';
import { listMessages, sendMessage, formatTime } from '../lib/chat';
import type { ChatMessage } from '../lib/chat';
import { useAuth } from '../auth/AuthContext';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import styles from './ChatRoomPage.module.scss';

export default function ChatRoomPage() {
  const { roomId = '0' } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const viewerId = user?.user_id ?? '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await listMessages(String(roomId));
      setMessages(data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    setLoading(true);
    void fetchMessages();
    // Polling fallback 8s
    const id = window.setInterval(() => {
      void fetchMessages();
    }, 8000);
    return () => window.clearInterval(id);
  }, [fetchMessages]);

  useEffect(() => {
    // scroll to latest
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // stop_typing timeout 1s via setTimeout on input change
  function onInputChange(val: string) {
    setInput(val);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      // placeholder for stop_typing emit — no socket wiring yet
    }, 1000);
  }

  async function onSend() {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const optimistic: ChatMessage = {
      room_id: String(roomId),
      user_id: viewerId,
      message: trimmed,
      datetime: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    try {
      await sendMessage(String(roomId), trimmed);
      await fetchMessages();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to send');
      // keep optimistic but mark? We leave it
    } finally {
      setSending(false);
    }
  }

  const title = roomId === '0' ? 'Public Chat' : messages.find((m) => m.user_id !== viewerId)?.nickname || `Room ${roomId}`;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <Link to="/chat" className={styles.back}>
          ← Back
        </Link>
        <div className={styles.headerMeta}>
          <h1 className={styles.title}>{title}</h1>
          {isTyping && <span className={styles.typing}>typing…</span>}
        </div>
      </div>

      {error && (
        <div className={styles.alert} role="alert">
          {error}
        </div>
      )}

      <div ref={listRef} className={styles.messages}>
        {loading ? (
          <div className={styles.loading}>
            <Skeleton variant="card" />
            <div style={{ height: 12 }} />
            <Skeleton variant="card" />
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.empty}>No messages yet — say hello!</div>
        ) : (
          messages.map((m, idx) => {
            const isSent = m.user_id === viewerId;
            const key = String(m.message_id ?? `${m.user_id}-${m.datetime}-${idx}`);
            return (
              <div key={key} className={`${styles.bubbleRow} ${isSent ? styles.sent : styles.received}`}>
                <div className={styles.bubble}>
                  {!isSent && m.nickname && <div className={styles.sender}>{m.nickname}</div>}
                  <div className={styles.text}>{m.message}</div>
                  <div className={styles.time}>{sending && idx === messages.length - 1 && isSent ? 'Sending…' : formatTime(m.datetime)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={styles.composer}>
        <input
          className={styles.input}
          placeholder="Type a message…"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
          aria-label="Message"
        />
        <Button variant="primary" size="sm" disabled={!input.trim() || sending} onClick={() => void onSend()}>
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  );
}

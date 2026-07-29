"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./portal.module.css";

export type PortalChatThread = {
  id: number;
  counterpartName: string;
  counterpartMeta: string;
};

type PortalChatMessage = {
  id: number;
  thread_id: number;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export default function ChatPanel({
  currentUserId,
  threads,
  heading = "튜터 채팅",
}: {
  currentUserId: string;
  threads: PortalChatThread[];
  heading?: string;
}) {
  const [activeThreadId, setActiveThreadId] = useState(
    threads[0]?.id ?? null,
  );
  const [messages, setMessages] = useState<PortalChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [activeThreadId, threads],
  );

  const loadMessages = useCallback(
    async (quiet = false) => {
      if (!activeThreadId) return;
      try {
        const response = await fetch(`/api/chat?threadId=${activeThreadId}`, {
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          if (!quiet) {
            setStatus(result.error || "메시지를 불러오지 못했습니다.");
          }
          return;
        }
        setMessages(result.messages ?? []);
        if (!quiet) setStatus("");
      } catch {
        if (!quiet) setStatus("메시지 연결을 확인해 주세요.");
      }
    },
    [activeThreadId],
  );

  useEffect(() => {
    setMessages([]);
    void loadMessages();
    const interval = window.setInterval(() => void loadMessages(true), 5000);
    return () => window.clearInterval(interval);
  }, [loadMessages]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = draft.trim();
    if (!activeThreadId || !message || sending) return;
    setSending(true);
    setStatus("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: activeThreadId, message }),
      });
      const result = await response.json();
      if (!response.ok) {
        setStatus(result.error || "메시지를 보내지 못했습니다.");
        return;
      }
      setMessages((current) => [...current, result as PortalChatMessage]);
      setDraft("");
    } catch {
      setStatus("메시지를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className={`${styles.panel} ${styles.chatPanel}`}>
      <div className={styles.panelHeading}>
        <div>
          <p>DIRECT MESSAGE</p>
          <h2>{heading}</h2>
        </div>
        <span className={styles.chatLive}>
          <i /> 5초마다 동기화
        </span>
      </div>

      {!threads.length ? (
        <div className={styles.chatEmpty}>
          배정된 수업이 생기면 학생과 튜터 사이의 대화방이 자동으로 열립니다.
        </div>
      ) : (
        <div className={styles.chatLayout}>
          <nav className={styles.chatThreads} aria-label="대화 상대">
            {threads.map((thread) => (
              <button
                type="button"
                key={thread.id}
                data-active={thread.id === activeThreadId}
                onClick={() => setActiveThreadId(thread.id)}
              >
                <b>{thread.counterpartName}</b>
                <span>{thread.counterpartMeta}</span>
              </button>
            ))}
          </nav>

          <div className={styles.chatConversation}>
            <header>
              <b>{activeThread?.counterpartName}</b>
              <span>{activeThread?.counterpartMeta}</span>
            </header>
            <div className={styles.chatMessages} aria-live="polite">
              {messages.length ? (
                messages.map((message) => {
                  const mine = message.sender_id === currentUserId;
                  return (
                    <article key={message.id} data-mine={mine}>
                      <p>{message.body}</p>
                      <time>
                        {new Intl.DateTimeFormat("ko-KR", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(message.created_at))}
                      </time>
                    </article>
                  );
                })
              ) : (
                <div className={styles.noMessages}>
                  첫 메시지를 보내 보세요.
                </div>
              )}
            </div>
            <form onSubmit={sendMessage}>
              <textarea
                value={draft}
                onChange={(event) =>
                  setDraft(event.target.value.slice(0, 2000))
                }
                placeholder={`${activeThread?.counterpartName ?? "상대방"}에게 메시지 보내기`}
                rows={2}
                maxLength={2000}
              />
              <button type="submit" disabled={sending || !draft.trim()}>
                {sending ? "전송 중" : "보내기"} <span>→</span>
              </button>
            </form>
            {status && <p className={styles.chatStatus}>{status}</p>}
          </div>
        </div>
      )}
    </section>
  );
}

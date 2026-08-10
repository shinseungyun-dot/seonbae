"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./consultations.module.css";

export type AdminConsultationRequest = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  curriculum: string;
  preferred_tutor: string | null;
  subject: string;
  goals: string;
  language: "ko" | "en";
  source: "website" | "footer";
  status: "new" | "contacted" | "closed";
  notification_sent_at: string | null;
  notification_error: string | null;
  created_at: string;
};

export default function ConsultationRequestList({ requests }: { requests: AdminConsultationRequest[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  async function updateStatus(id: number, status: AdminConsultationRequest["status"]) {
    setBusy(id);
    setMessage("");
    try {
      const response = await fetch("/api/admin/consultation-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "상담 상태를 저장하지 못했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={styles.requestList}>
      {message && <p className={styles.message} role="alert">{message}</p>}
      {requests.length ? requests.map((request) => (
        <article key={request.id}>
          <header>
            <div>
              <small>#{request.id} · {request.curriculum} · {request.source === "footer" ? "빠른 상담" : "상담 페이지"}</small>
              <h2>{request.name} · {request.subject}</h2>
              <p><a href={`mailto:${request.email}`}>{request.email}</a>{request.phone ? ` · ${request.phone}` : ""}</p>
            </div>
            <div className={styles.meta}>
              <time>{formatDate(request.created_at)}</time>
              <span data-status={request.status}>{statusLabel(request.status)}</span>
            </div>
          </header>
          <dl>
            <div><dt>희망 튜터</dt><dd>{request.preferred_tutor || "팀 추천"}</dd></div>
            <div><dt>언어</dt><dd>{request.language === "ko" ? "한국어" : "English"}</dd></div>
            <div><dt>이메일</dt><dd className={request.notification_sent_at ? styles.sent : styles.warning}>{request.notification_sent_at ? "전송 완료" : `전송 실패 · ${request.notification_error || "설정 확인 필요"}`}</dd></div>
          </dl>
          <div className={styles.goals}><b>목표와 현재 상황</b><p>{request.goals}</p></div>
          <footer>
            <a href={`mailto:${request.email}?subject=${encodeURIComponent(`[선배 상담 #${request.id}] 답변`)}`}>이메일 답장</a>
            <div>
              {request.status !== "new" && <button type="button" disabled={busy === request.id} onClick={() => updateStatus(request.id, "new")}>신규로 되돌리기</button>}
              {request.status !== "contacted" && <button type="button" disabled={busy === request.id} onClick={() => updateStatus(request.id, "contacted")}>연락 완료</button>}
              {request.status !== "closed" && <button type="button" disabled={busy === request.id} onClick={() => updateStatus(request.id, "closed")}>종결</button>}
            </div>
          </footer>
        </article>
      )) : <div className={styles.empty}>접수된 상담 신청이 없습니다.</div>}
    </div>
  );
}

function statusLabel(status: AdminConsultationRequest["status"]) {
  if (status === "contacted") return "연락 완료";
  if (status === "closed") return "종결";
  return "신규";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

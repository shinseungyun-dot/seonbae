"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./applications.module.css";

export type AccountApplication = {
  id: number; user_id: string; full_name: string; email: string; phone: string;
  requested_role: "student" | "parent" | "tutor"; acceptance_letter_name: string;
  status: string; notification_sent_at: string | null; notification_error: string | null;
  created_at: string; documentUrl: string | null;
};
export type CredentialApplication = {
  id: number; tutor_id: string; tutor_registry_id: string | null; tutorName: string;
  credential_type: string; title: string; issuer: string; score: string | null;
  issued_on: string | null; proof_name: string; status: string; created_at: string; documentUrl: string | null;
};

export default function ApplicationReviewClient({ accounts, credentials }: { accounts: AccountApplication[]; credentials: CredentialApplication[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function decide(kind: "account" | "credential", id: number, decision: "approved" | "rejected") {
    const key = `${kind}-${id}`;
    setBusy(key);
    setMessage("");
    try {
      const response = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, decision, note: notes[key] || "" }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "심사 결과를 저장하지 못했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className={styles.reviewGrid}>
      {message && <p className={styles.message} role="alert">{message}</p>}
      <section>
        <header><div><p>ACCOUNT REQUESTS</p><h2>계정 가입 심사</h2></div><span>{accounts.length}</span></header>
        {accounts.length ? accounts.map((item) => {
          const key = `account-${item.id}`;
          return <article key={key}>
            <div className={styles.title}><div><small>#{item.id} · {roleLabel(item.requested_role)}</small><h3>{item.full_name}</h3><p>{item.email} · {item.phone}</p></div><time>{formatDate(item.created_at)}</time></div>
            <a className={styles.document} href={item.documentUrl || undefined} target="_blank" rel="noreferrer" aria-disabled={!item.documentUrl}>합격통지서 · {item.acceptance_letter_name}</a>
            <span className={item.notification_sent_at ? styles.sent : styles.warning}>{item.notification_sent_at ? "admissions 이메일 전송 완료" : "이메일 전송 대기 · 심사함에는 저장됨"}</span>
            <textarea placeholder="승인 또는 보완 요청 메모" value={notes[key] || ""} onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))} />
            <div className={styles.actions}><button type="button" disabled={busy === key} onClick={() => decide("account", item.id, "rejected")}>보완 요청</button><button type="button" disabled={busy === key} onClick={() => decide("account", item.id, "approved")}>계정 승인</button></div>
          </article>;
        }) : <div className={styles.empty}>대기 중인 가입 신청이 없습니다.</div>}
      </section>
      <section>
        <header><div><p>TUTOR CREDENTIALS</p><h2>튜터 자격 검증</h2></div><span>{credentials.length}</span></header>
        {credentials.length ? credentials.map((item) => {
          const key = `credential-${item.id}`;
          return <article key={key}>
            <div className={styles.title}><div><small>#{item.id} · {item.credential_type}</small><h3>{item.title}</h3><p>{item.tutorName} · {item.issuer}{item.score ? ` · ${item.score}` : ""}</p></div><time>{formatDate(item.created_at)}</time></div>
            <a className={styles.document} href={item.documentUrl || undefined} target="_blank" rel="noreferrer" aria-disabled={!item.documentUrl}>원본 증빙 · {item.proof_name}</a>
            <textarea placeholder="검증 결과 또는 보완 요청 메모" value={notes[key] || ""} onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))} />
            <div className={styles.actions}><button type="button" disabled={busy === key} onClick={() => decide("credential", item.id, "rejected")}>보완 요청</button><button type="button" disabled={busy === key} onClick={() => decide("credential", item.id, "approved")}>검증 승인</button></div>
          </article>;
        }) : <div className={styles.empty}>대기 중인 자격 자료가 없습니다.</div>}
      </section>
    </div>
  );
}

function roleLabel(role: AccountApplication["requested_role"]) { return role === "parent" ? "보호자" : role === "tutor" ? "튜터" : "학생"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }


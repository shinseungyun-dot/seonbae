"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./applications.module.css";

export type AccountApplication = {
  id: number;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  requested_role: "student" | "parent" | "tutor";
  acceptance_letter_name: string | null;
  referral_code: string | null;
  status: string;
  notification_sent_at: string | null;
  notification_error: string | null;
  created_at: string;
  documentUrl: string | null;
};

export type CredentialApplication = {
  id: number;
  tutor_id: string;
  tutor_registry_id: string | null;
  tutorName: string;
  credential_type: string;
  title: string;
  issuer: string;
  score: string | null;
  issued_on: string | null;
  proof_name: string;
  status: string;
  created_at: string;
  documentUrl: string | null;
};

export default function ApplicationReviewClient({
  accounts,
  credentials,
}: {
  accounts: AccountApplication[];
  credentials: CredentialApplication[];
}) {
  const router = useRouter();
  const [accountItems, setAccountItems] = useState(accounts);
  const [credentialItems, setCredentialItems] = useState(credentials);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  useEffect(() => setAccountItems(accounts), [accounts]);
  useEffect(() => setCredentialItems(credentials), [credentials]);

  async function decide(kind: "account" | "credential", id: number, decision: "approved" | "rejected") {
    const key = `${kind}-${id}`;
    const removed = kind === "account"
      ? accountItems.find((item) => item.id === id)
      : credentialItems.find((item) => item.id === id);

    if (kind === "account") setAccountItems((items) => items.filter((item) => item.id !== id));
    else setCredentialItems((items) => items.filter((item) => item.id !== id));
    setMessage(decision === "approved" ? "승인을 반영하고 있습니다…" : "반려를 반영하고 있습니다…");

    try {
      const response = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, id, decision, note: notes[key] || "" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "심사 결과를 저장하지 못했습니다.");

      setMessage(decision === "approved" ? "승인되었습니다." : "반려되었습니다.");
      router.refresh();
    } catch (error) {
      if (removed) {
        if (kind === "account") {
          setAccountItems((items) => [...items, removed as AccountApplication].sort(byCreatedAt));
        } else {
          setCredentialItems((items) => [...items, removed as CredentialApplication].sort(byCreatedAt));
        }
      }
      setMessage(error instanceof Error ? error.message : "네트워크 연결을 확인하고 다시 시도해 주세요.");
    }
  }

  return (
    <div className={styles.reviewGrid}>
      {message && <p className={styles.message} aria-live="polite">{message}</p>}
      <section>
        <header><div><p>ACCOUNT REQUESTS</p><h2>계정 가입 심사</h2></div><span>{accountItems.length}</span></header>
        {accountItems.length ? accountItems.map((item) => {
          const key = `account-${item.id}`;
          return (
            <article key={key}>
              <div className={styles.title}>
                <div><small>#{item.id} · {roleLabel(item.requested_role)}</small><h3>{item.full_name}</h3><p>{item.email} · {item.phone}</p></div>
                <time>{formatDate(item.created_at)}</time>
              </div>
              {item.documentUrl && item.acceptance_letter_name
                ? <a className={styles.document} href={item.documentUrl} target="_blank" rel="noreferrer">합격통지서 · {item.acceptance_letter_name}</a>
                : <span className={styles.noDocument}>추가 제출 서류 없음</span>}
              {item.requested_role === "tutor" && item.referral_code && (
                <span className={styles.sent}>추천인 · {item.referral_code}</span>
              )}
              <span className={item.notification_sent_at ? styles.sent : styles.warning}>
                {item.notification_sent_at ? "admissions 이메일 전송 완료" : "이메일 전송 대기 · 심사는 포털에서 가능"}
              </span>
              <textarea
                aria-label={`${item.full_name} 심사 메모`}
                placeholder="승인 또는 보완 요청 메모"
                value={notes[key] || ""}
                onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))}
              />
              <div className={styles.actions}>
                <button type="button" onClick={() => decide("account", item.id, "rejected")}>보완 요청</button>
                <button type="button" onClick={() => decide("account", item.id, "approved")}>계정 승인</button>
              </div>
            </article>
          );
        }) : <div className={styles.empty}>대기 중인 가입 요청이 없습니다.</div>}
      </section>
      <section>
        <header><div><p>TUTOR CREDENTIALS</p><h2>튜터 자격 검증</h2></div><span>{credentialItems.length}</span></header>
        {credentialItems.length ? credentialItems.map((item) => {
          const key = `credential-${item.id}`;
          return (
            <article key={key}>
              <div className={styles.title}>
                <div><small>#{item.id} · {item.credential_type}</small><h3>{item.title}</h3><p>{item.tutorName} · {item.issuer}{item.score ? ` · ${item.score}` : ""}</p></div>
                <time>{formatDate(item.created_at)}</time>
              </div>
              <a className={styles.document} href={item.documentUrl || undefined} target="_blank" rel="noreferrer" aria-disabled={!item.documentUrl}>원본 증빙 · {item.proof_name}</a>
              <textarea
                aria-label={`${item.tutorName} 자격 검증 메모`}
                placeholder="검증 결과 또는 보완 요청 메모"
                value={notes[key] || ""}
                onChange={(event) => setNotes((current) => ({ ...current, [key]: event.target.value }))}
              />
              <div className={styles.actions}>
                <button type="button" onClick={() => decide("credential", item.id, "rejected")}>보완 요청</button>
                <button type="button" onClick={() => decide("credential", item.id, "approved")}>검증 승인</button>
              </div>
            </article>
          );
        }) : <div className={styles.empty}>대기 중인 자격 자료가 없습니다.</div>}
      </section>
    </div>
  );
}

function roleLabel(role: AccountApplication["requested_role"]) {
  if (role === "parent") return "보호자";
  if (role === "tutor") return "튜터";
  return "학생";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function byCreatedAt<T extends { created_at: string }>(left: T, right: T) {
  return Date.parse(left.created_at) - Date.parse(right.created_at);
}

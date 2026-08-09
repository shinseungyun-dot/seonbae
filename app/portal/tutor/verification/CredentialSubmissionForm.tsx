"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./verification.module.css";

export type TutorCredential = {
  id: number;
  credential_type: "enrollment" | "degree" | "test_score" | "certificate" | "other";
  title: string;
  issuer: string;
  score: string | null;
  issued_on: string | null;
  proof_name: string;
  status: "pending" | "approved" | "rejected";
  display_on_profile: boolean;
  review_note: string | null;
  created_at: string;
};

export default function CredentialSubmissionForm({ credentials }: { credentials: TutorCredential[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/tutor-credentials", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "검증 자료를 제출하지 못했습니다.");
        return;
      }
      event.currentTarget.reset();
      setMessage("검증 자료를 제출했습니다. 선배 팀 검토 후 프로필에 반영됩니다.");
      router.refresh();
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.workspace}>
      <form className={styles.form} onSubmit={submit}>
        <header><b>새 증빙 제출</b><span>원본 자료에서 민감한 식별번호는 가려도 됩니다.</span></header>
        <label><span>자료 유형</span><select name="credentialType" defaultValue="test_score" required>
          <option value="test_score">시험 성적</option><option value="enrollment">재학 증명</option>
          <option value="degree">졸업·학위</option><option value="certificate">자격증</option><option value="other">기타</option>
        </select></label>
        <label><span>표시 제목</span><input name="title" placeholder="예: SAT 1580" maxLength={180} required /></label>
        <label><span>발급 기관</span><input name="issuer" placeholder="예: College Board" maxLength={180} required /></label>
        <label><span>점수·등급</span><input name="score" placeholder="예: 1580 / 1600" maxLength={100} /></label>
        <label><span>발급일</span><input name="issuedOn" type="date" max={new Date().toISOString().slice(0, 10)} /></label>
        <label><span>원본 증빙</span><input name="proof" type="file" accept=".pdf,.jpg,.jpeg,.png" required /></label>
        <small>PDF, JPG 또는 PNG · 최대 10MB · 승인 전까지 공개되지 않습니다.</small>
        {message && <p role="status">{message}</p>}
        <button type="submit" disabled={busy}>{busy ? "제출 중..." : "검증 요청 제출"}</button>
      </form>

      <section className={styles.history}>
        <header><div><p>CREDENTIAL LOG</p><h2>제출 내역</h2></div><span>{credentials.length}건</span></header>
        {credentials.length ? credentials.map((item) => (
          <article key={item.id}>
            <div><small>{typeLabel(item.credential_type)} · {item.issuer}</small><h3>{item.title}</h3>{item.score && <b>{item.score}</b>}</div>
            <span data-status={item.status}>{statusLabel(item.status)}</span>
            <dl><div><dt>증빙</dt><dd><a href={`/api/tutor-credentials?file=${item.id}`} target="_blank" rel="noreferrer">{item.proof_name}</a></dd></div><div><dt>프로필</dt><dd>{item.display_on_profile ? "공개 중" : "승인 후 공개"}</dd></div></dl>
            {item.review_note && <aside><b>검토 메모</b><p>{item.review_note}</p></aside>}
          </article>
        )) : <div className={styles.empty}>아직 제출한 자격 자료가 없습니다.</div>}
      </section>
    </div>
  );
}

function typeLabel(value: TutorCredential["credential_type"]) {
  return ({ enrollment: "재학 증명", degree: "졸업·학위", test_score: "시험 성적", certificate: "자격증", other: "기타" })[value];
}
function statusLabel(value: TutorCredential["status"]) {
  return value === "approved" ? "검증 완료" : value === "rejected" ? "보완 요청" : "검토 중";
}


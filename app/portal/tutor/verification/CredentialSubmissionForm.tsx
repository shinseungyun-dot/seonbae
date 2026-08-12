"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./verification.module.css";
import { usePortalText } from "../../PortalLocale";

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
  const { locale, text: l } = usePortalText();
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
        setMessage(result.error || l("검증 자료를 제출하지 못했습니다.", "The verification document could not be submitted."));
        return;
      }
      event.currentTarget.reset();
      setMessage(l("검증 자료를 제출했습니다. 선배 팀 검토 후 프로필에 반영됩니다.", "Document submitted. It will appear on your profile after Seonbae team review."));
      router.refresh();
    } catch {
      setMessage(l("네트워크 연결을 확인한 뒤 다시 시도해 주세요.", "Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.workspace}>
      <form className={styles.form} onSubmit={submit}>
        <header><b>{l("새 증빙 제출", "Submit a new document")}</b><span>{l("원본 자료에서 민감한 식별번호는 가려도 됩니다.", "You may redact sensitive identification numbers from the original document.")}</span></header>
        <label><span>{l("자료 유형", "Document type")}</span><select name="credentialType" defaultValue="test_score" required>
          <option value="test_score">{l("시험 성적", "Test score")}</option><option value="enrollment">{l("재학 증명", "Enrollment")}</option>
          <option value="degree">{l("졸업·학위", "Degree")}</option><option value="certificate">{l("자격증", "Certificate")}</option><option value="other">{l("기타", "Other")}</option>
        </select></label>
        <label><span>{l("표시 제목", "Display title")}</span><input name="title" placeholder={l("예: SAT 1580", "e.g. SAT 1580")} maxLength={180} required /></label>
        <label><span>{l("발급 기관", "Issuer")}</span><input name="issuer" placeholder={l("예: College Board", "e.g. College Board")} maxLength={180} required /></label>
        <label><span>{l("점수·등급", "Score or grade")}</span><input name="score" placeholder={l("예: 1580 / 1600", "e.g. 1580 / 1600")} maxLength={100} /></label>
        <label><span>{l("발급일", "Issue date")}</span><input name="issuedOn" type="date" max={new Date().toISOString().slice(0, 10)} /></label>
        <label><span>{l("원본 증빙", "Original document")}</span><input name="proof" type="file" accept=".pdf,.jpg,.jpeg,.png" required /></label>
        <small>{l("PDF, JPG 또는 PNG · 최대 10MB · 승인 전까지 공개되지 않습니다.", "PDF, JPG, or PNG · up to 10MB · hidden until approved.")}</small>
        {message && <p role="status">{message}</p>}
        <button type="submit" disabled={busy}>{busy ? l("제출 중...", "Submitting...") : l("검증 요청 제출", "Submit for verification")}</button>
      </form>

      <section className={styles.history}>
        <header><div><p>CREDENTIAL LOG</p><h2>{l("제출 내역", "Submission history")}</h2></div><span>{l(`${credentials.length}건`, `${credentials.length}`)}</span></header>
        {credentials.length ? credentials.map((item) => (
          <article key={item.id}>
            <div><small>{typeLabel(item.credential_type, locale)} · {item.issuer}</small><h3>{item.title}</h3>{item.score && <b>{item.score}</b>}</div>
            <span data-status={item.status}>{statusLabel(item.status, locale)}</span>
            <dl><div><dt>{l("증빙", "Document")}</dt><dd><a href={`/api/tutor-credentials?file=${item.id}`} target="_blank" rel="noreferrer">{item.proof_name}</a></dd></div><div><dt>{l("프로필", "Profile")}</dt><dd>{item.display_on_profile ? l("공개 중", "Published") : l("승인 후 공개", "Published after approval")}</dd></div></dl>
            {item.review_note && <aside><b>{l("검토 메모", "Review note")}</b><p>{item.review_note}</p></aside>}
          </article>
        )) : <div className={styles.empty}>{l("아직 제출한 자격 자료가 없습니다.", "No verification documents have been submitted yet.")}</div>}
      </section>
    </div>
  );
}

function typeLabel(value: TutorCredential["credential_type"], locale: "ko" | "en") {
  const ko = { enrollment: "재학 증명", degree: "졸업·학위", test_score: "시험 성적", certificate: "자격증", other: "기타" };
  const en = { enrollment: "Enrollment", degree: "Degree", test_score: "Test score", certificate: "Certificate", other: "Other" };
  return (locale === "ko" ? ko : en)[value];
}
function statusLabel(value: TutorCredential["status"], locale: "ko" | "en") {
  if (locale === "en") return value === "approved" ? "Verified" : value === "rejected" ? "Changes requested" : "In review";
  return value === "approved" ? "검증 완료" : value === "rejected" ? "보완 요청" : "검토 중";
}

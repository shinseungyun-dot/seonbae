"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { sanitizePhoneInput } from "../../utils/auth/phone";
import styles from "./tutor-apply.module.css";

const DOCUMENT_ACCEPT = "application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png";

export default function TutorApplicationForm() {
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/tutor-applications", {
      method: "POST",
      body: new FormData(event.currentTarget),
    }).catch(() => null);
    setBusy(false);

    if (!response || !response.ok) {
      const payload = response ? await response.json().catch(() => null) : null;
      setError(payload?.error || "지원서를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className={styles.form}>
        <div className={styles.formHeading}>
          <span>TUTOR APPLICATION</span>
          <h3>지원서가 접수되었습니다.</h3>
        </div>
        <p className={styles.formNote}>
          제출하신 서류를 검토한 뒤 영업일 기준 이틀 안에 연락드립니다. 승인되면 선배 팀이 튜터 계정을
          만들어 임시 비밀번호를 이메일로 보내드립니다.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={submitApplication}>
      <div className={styles.formHeading}>
        <span>TUTOR APPLICATION</span>
        <h3>기본 지원 정보</h3>
      </div>
      <div className={styles.fields}>
        <label>
          <span>이름</span>
          <input name="fullName" autoComplete="name" minLength={2} maxLength={80} required />
        </label>
        <label>
          <span>학교 이메일</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@snu.ac.kr"
            maxLength={254}
            required
          />
        </label>
        <label>
          <span>휴대전화번호</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="01012345678"
            maxLength={24}
            onInput={(event) => {
              event.currentTarget.value = sanitizePhoneInput(event.currentTarget.value);
            }}
            required
          />
        </label>
        <label>
          <span>대학교</span>
          <select name="university" defaultValue="" required>
            <option value="" disabled>
              선택해 주세요
            </option>
            <option>서울대학교</option>
            <option>고려대학교</option>
            <option>연세대학교</option>
            <option>기타</option>
          </select>
        </label>
        <label>
          <span>전공 / 학년</span>
          <input name="major" placeholder="예: 국제학부 / 2학년" maxLength={120} required />
        </label>
        <label>
          <span>지원 커리큘럼</span>
          <select name="curriculum" defaultValue="IB" required>
            <option>IB</option>
            <option>AP</option>
            <option>A-Level</option>
            <option>IGCSE</option>
            <option>SAT</option>
            <option>ACT</option>
            <option>TOEFL</option>
            <option>IELTS</option>
            <option>국제학교 내신</option>
            <option>기타</option>
          </select>
        </label>
        <label>
          <span>공식 성적</span>
          <input name="score" placeholder="예: IB 43/45" maxLength={120} required />
        </label>
        <label>
          <span>수업 가능 과목</span>
          <input name="subjects" placeholder="예: Economics HL, Business" maxLength={300} required />
        </label>
        <label>
          <span>학교 합격통지서</span>
          <input type="file" name="acceptanceLetter" accept={DOCUMENT_ACCEPT} required />
          <small>PDF, JPG 또는 PNG · 최대 10MB</small>
        </label>
        <label>
          <span>성적·자격 증빙 서류</span>
          <input type="file" name="credential" accept={DOCUMENT_ACCEPT} required />
          <small>공식 성적표 원본 · PDF, JPG 또는 PNG · 최대 10MB</small>
        </label>
        <label>
          <span>추천인 또는 추천 코드 (선택)</span>
          <input name="referralCode" maxLength={80} autoComplete="off" />
        </label>
        <label className={styles.full}>
          <span>소개 및 수업 경험</span>
          <textarea
            name="introduction"
            rows={5}
            maxLength={2000}
            placeholder="지원 동기, 수업 경험, 가능한 시간대를 간단히 적어 주세요."
            required
          />
        </label>
      </div>
      <label className={styles.consent}>
        <input type="checkbox" required />
        <span>
          [필수] 지원 검토와 연락을 위한 개인정보 수집·이용에 동의합니다.{" "}
          <Link href="/privacy" target="_blank">
            처리방침 보기
          </Link>
        </span>
      </label>
      <button className={styles.submit} type="submit" disabled={busy}>
        {busy ? "접수 중..." : "지원서 제출"} <span aria-hidden="true">↗</span>
      </button>
      <p className={styles.formNote} aria-live="polite">
        {error || "튜터 계정은 심사 후 선배 팀이 직접 만들어 드립니다. 이 화면에서는 계정이 생성되지 않습니다."}
      </p>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { sanitizePhoneInput } from "../../utils/auth/phone";
import styles from "./tutor-apply.module.css";

export default function TutorApplicationForm() {
  const [submitted, setSubmitted] = useState(false);

  function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = [
      `이름: ${data.get("name")}`,
      `이메일: ${data.get("email")}`,
      `휴대전화번호: ${data.get("phone")}`,
      `대학교: ${data.get("university")}`,
      `전공 / 학년: ${data.get("major")}`,
      `지원 커리큘럼: ${data.get("curriculum")}`,
      `공식 성적: ${data.get("score")}`,
      `수업 가능 과목: ${data.get("subjects")}`,
      `소개 및 수업 경험: ${data.get("introduction")}`,
    ].join("\n");

    setSubmitted(true);
    window.location.href = `mailto:admissions@seonbae.com?subject=${encodeURIComponent(
      "선배 튜터 지원",
    )}&body=${encodeURIComponent(body)}`;
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
          <input name="name" autoComplete="name" required />
        </label>
        <label>
          <span>이메일</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span>휴대전화번호</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="01012345678"
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
          <input name="major" placeholder="예: 국제학부 / 2학년" required />
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
          <input name="score" placeholder="예: IB 43/45" required />
        </label>
        <label>
          <span>수업 가능 과목</span>
          <input name="subjects" placeholder="예: Economics HL, Business" required />
        </label>
        <label className={styles.full}>
          <span>소개 및 수업 경험</span>
          <textarea
            name="introduction"
            rows={5}
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
      <button className={styles.submit} type="submit">
        이메일로 지원서 보내기 <span aria-hidden="true">↗</span>
      </button>
      <p className={styles.formNote} aria-live="polite">
        {submitted
          ? "이메일 작성 화면이 열렸습니다. 내용을 확인한 뒤 전송해 주세요."
          : "제출하면 기본 이메일 앱이 열립니다. 첨부 서류는 첫 회신 후 요청드립니다."}
      </p>
    </form>
  );
}

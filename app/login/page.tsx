"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });
    const result = await response.json();

    if (!response.ok || !result.destination) {
      setMessage(result.error || "아이디 또는 비밀번호를 다시 확인해 주세요.");
      setBusy(false);
      return;
    }

    router.replace(result.destination);
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/#/ko/home" aria-label="선배 홈">
          <img src="/seonbae-logo-antique.png" alt="" />
          <span className={styles.brandKo}>선배</span>
          <span className={styles.brandRule} />
          <span className={styles.brandEn}>SEONBAE<small>EST. 2026</small></span>
        </Link>
        <Link className={styles.back} href="/#/ko/home">홈으로 돌아가기 <span aria-hidden="true">↗</span></Link>
      </header>

      <section className={styles.authHero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>SEONBAE LEARNING PORTAL</p>
          <h1>수업의 흐름을<br /><em>한곳에서.</em></h1>
          <p className={styles.intro}>
            예정된 수업, 담당 튜터, 수업 시간과 전달 사항을 한눈에 확인하세요.
            상담에서 시작된 학습 계획이 실제 수업까지 끊기지 않도록 정리합니다.
          </p>
          <div className={styles.benefits}>
            <article><span>01</span><div><b>주간 수업 일정</b><p>이번 주 수업과 변경 사항을 날짜별로 확인합니다.</p></div></article>
            <article><span>02</span><div><b>담당 튜터 정보</b><p>수업별 담당 튜터와 과목을 바로 확인합니다.</p></div></article>
            <article><span>03</span><div><b>중앙 관리</b><p>선배 팀이 업데이트한 일정이 포털에 반영됩니다.</p></div></article>
          </div>
        </div>

        <div className={styles.loginSurface}>
          <div className={styles.formHeading}>
            <p>SECURE ACCESS</p>
            <h2>로그인</h2>
            <span>등록된 계정으로 선배 포털에 접속합니다.</span>
          </div>

          <form onSubmit={handleSubmit}>
            <label>
              <span>아이디 또는 이메일</span>
              <input
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </label>
            <label>
              <span>비밀번호</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            </label>
            {message && <p className={styles.formMessage} role="status">{message}</p>}
            <button className={styles.submit} type="submit" disabled={busy}>
              <span>{busy ? "확인 중..." : "로그인"}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          <p className={styles.secure}>암호화된 Supabase 인증 · 권한별 접근 제어</p>
        </div>
      </section>
    </main>
  );
}

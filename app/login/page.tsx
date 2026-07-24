"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

type AuthAction = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [action, setAction] = useState<AuthAction>("signin");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (action === "signup" && password !== confirmPassword) {
      setMessage("비밀번호가 서로 일치하지 않습니다.");
      setBusy(false);
      return;
    }

    const response = await fetch(action === "signup" ? "/api/auth/signup" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action === "signup"
        ? { fullName, email: identifier, password }
        : { identifier, password, remember }),
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.error || "입력한 정보를 다시 확인해 주세요.");
      setBusy(false);
      return;
    }

    if (result.destination) {
      router.replace(result.destination);
      router.refresh();
      return;
    }

    setMessage(result.message || "가입 확인 메일을 보냈습니다.");
    setBusy(false);
  }

  function switchAction(nextAction: AuthAction) {
    setAction(nextAction);
    setFullName("");
    setIdentifier("");
    setPassword("");
    setConfirmPassword("");
    setMessage("");
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
            <h2>{action === "signin" ? "로그인" : "회원가입"}</h2>
            <span>{action === "signin" ? "등록된 계정으로 선배 포털에 접속합니다." : "선배 포털에서 수업 일정과 튜터 정보를 확인하세요."}</span>
          </div>

          <form onSubmit={handleSubmit}>
            {action === "signup" && (
              <label>
                <span>이름</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label>
              <span>{action === "signin" ? "아이디 또는 이메일" : "이메일"}</span>
              <input
                type={action === "signin" ? "text" : "email"}
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete={action === "signin" ? "username" : "email"}
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </label>
            <label>
              <span>비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={action === "signin" ? "current-password" : "new-password"}
                minLength={action === "signup" ? 8 : undefined}
                required
              />
            </label>
            {action === "signup" && (
              <label>
                <span>비밀번호 확인</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            )}
            {action === "signin" && (
              <label className={styles.remember}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                />
                <span>로그인 상태 유지</span>
              </label>
            )}
            {message && <p className={styles.formMessage} role="status">{message}</p>}
            <button className={styles.submit} type="submit" disabled={busy}>
              <span>{busy ? "확인 중..." : action === "signin" ? "로그인" : "회원가입"}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          <div className={styles.authFooter}>
            <span>{action === "signin" ? "아직 계정이 없으신가요?" : "이미 계정이 있으신가요?"}</span>
            <button type="button" onClick={() => switchAction(action === "signin" ? "signup" : "signin")}>
              {action === "signin" ? "회원가입" : "로그인"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

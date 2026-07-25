"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPasswordChecks,
  getPasswordPolicyError,
  PASSWORD_ALLOWED_SYMBOLS,
} from "../../utils/auth/password";
import styles from "./reset.module.css";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const checks = useMemo(() => getPasswordChecks(password), [password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const passwordError = getPasswordPolicyError(password);
    if (passwordError) {
      setMessage(passwordError);
      return;
    }
    if (password !== confirmation) {
      setMessage("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "비밀번호를 변경하지 못했습니다.");
        return;
      }

      router.replace(result.destination || "/portal");
      router.refresh();
    } catch {
      setMessage("요청을 처리하지 못했습니다. 네트워크 연결을 확인해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/#/ko/home" aria-label="선배 홈">
          <img src="/seonbae-logo-antique.png" alt="" />
          <span>선배</span>
        </Link>
        <Link href="/login">로그인으로 돌아가기 ↗</Link>
      </header>

      <section className={styles.stage}>
        <div className={styles.copy}>
          <p>ACCOUNT RECOVERY</p>
          <h1>새 비밀번호를<br />설정해 주세요.</h1>
          <span>
            이 링크로 확인된 계정에 새 비밀번호를 적용합니다. 다른 서비스에서 사용한
            비밀번호는 피하고, 가능하면 비밀번호 관리자를 이용해 주세요.
          </span>
        </div>
        <form className={styles.card} onSubmit={handleSubmit}>
          <div>
            <h2>비밀번호 변경</h2>
            <p>아래 조건을 모두 충족해야 합니다.</p>
          </div>
          <label>
            <span>새 비밀번호</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          <ul className={styles.checks} aria-live="polite">
            <li data-valid={checks.length}>12자 이상</li>
            <li data-valid={checks.lower && checks.upper}>영문 소문자와 대문자</li>
            <li data-valid={checks.number}>숫자</li>
            <li data-valid={checks.symbol}>특수문자</li>
            <li data-valid={checks.allowed}>공백 없이 허용된 문자만 사용</li>
          </ul>
          <details>
            <summary>허용 특수문자 보기</summary>
            <code>{PASSWORD_ALLOWED_SYMBOLS}</code>
          </details>
          <label>
            <span>새 비밀번호 확인</span>
            <input
              type="password"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
            />
          </label>
          {message && <p className={styles.message} role="status">{message}</p>}
          <button type="submit" disabled={busy}>
            <span>{busy ? "변경 중..." : "비밀번호 변경"}</span>
            <span aria-hidden="true">↗</span>
          </button>
        </form>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPasswordChecks,
  getPasswordPolicyError,
  PASSWORD_ALLOWED_SYMBOLS,
} from "../../utils/auth/password";
import { normalizePhone, sanitizePhoneInput } from "../../utils/auth/phone";
import styles from "./login.module.css";

type AuthAction = "signin" | "signup" | "find-id" | "reset-password";

const actionCopy: Record<
  AuthAction,
  { title: string; description: string; submit: string }
> = {
  signin: {
    title: "로그인",
    description: "등록된 계정으로 선배 포털에 접속합니다.",
    submit: "로그인",
  },
  signup: {
    title: "회원가입",
    description: "학생 또는 보호자 계정을 선택하고 전용 포털을 시작하세요.",
    submit: "회원가입",
  },
  "find-id": {
    title: "아이디 찾기",
    description: "가입 정보가 일치하면 등록된 이메일로 안전한 계정 접속 링크를 보내드립니다.",
    submit: "계정 접속 메일 받기",
  },
  "reset-password": {
    title: "비밀번호 재설정",
    description: "가입 정보가 일치하면 이메일로 안전한 재설정 링크를 보내드립니다.",
    submit: "재설정 메일 받기",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [action, setAction] = useState<AuthAction>("signin");
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountRole, setAccountRole] = useState<"student" | "parent">("student");
  const [remember, setRemember] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const allRequiredAgreed = privacyAgreed && termsAgreed && ageConfirmed;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (action === "signup") {
      const passwordError = getPasswordPolicyError(password);
      if (passwordError) {
        setMessage(passwordError);
        setBusy(false);
        return;
      }
      if (password !== confirmPassword) {
        setMessage("비밀번호가 서로 일치하지 않습니다.");
        setBusy(false);
        return;
      }
      if (!normalizePhone(phone)) {
        setMessage("휴대전화번호를 올바르게 입력해 주세요. 해외 번호는 국가번호를 포함해 주세요.");
        setBusy(false);
        return;
      }
      if (!privacyAgreed || !termsAgreed || !ageConfirmed) {
        setMessage("회원가입에 필요한 필수 항목을 모두 확인하고 동의해 주세요.");
        setBusy(false);
        return;
      }
    }

    const endpoint =
      action === "signup"
        ? "/api/auth/signup"
        : action === "signin"
          ? "/api/auth/login"
          : "/api/auth/recovery";
    const body =
      action === "signup"
        ? {
            fullName,
            email: identifier,
            phone,
            password,
            accountRole,
            privacyAgreed,
            termsAgreed,
            ageConfirmed,
          }
        : action === "signin"
          ? { identifier, password, remember }
          : {
              action,
              fullName,
              phone,
              ...(action === "reset-password" ? { email: identifier } : {}),
            };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
    } catch {
      setMessage("요청을 처리하지 못했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleAuth() {
    setMessage("");

    if (action === "signup") {
      if (!normalizePhone(phone)) {
        setMessage(
          "Google 가입에도 올바른 휴대전화번호를 입력해 주세요. 해외 번호는 국가번호를 포함해 주세요.",
        );
        return;
      }
      if (!privacyAgreed || !termsAgreed || !ageConfirmed) {
        setMessage("Google 가입에 필요한 필수 항목을 모두 확인하고 동의해 주세요.");
        return;
      }
    }

    setGoogleBusy(true);
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: action === "signup" ? "signup" : "signin",
          accountRole,
          phone,
          privacyAgreed,
          termsAgreed,
          ageConfirmed,
          next: new URLSearchParams(window.location.search).get("next") || "/portal",
        }),
      });
      const result = await response.json();

      if (!response.ok || typeof result.url !== "string") {
        setMessage(
          result.error
          || "Google 인증을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
        return;
      }

      window.location.assign(result.url);
    } catch {
      setMessage("Google 인증 서버에 연결하지 못했습니다. 네트워크를 확인해 주세요.");
    } finally {
      setGoogleBusy(false);
    }
  }

  function switchAction(nextAction: AuthAction) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setAction(nextAction);
    setFullName("");
    setIdentifier("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
    setAccountRole("student");
    setPrivacyAgreed(false);
    setTermsAgreed(false);
    setAgeConfirmed(false);
    setMessage("");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() =>
        window.scrollTo({ top: 0, left: 0, behavior: "auto" }),
      );
    });
  }

  const isSignup = action === "signup";
  const isRecovery = action === "find-id" || action === "reset-password";

  function setAllRequiredAgreements(checked: boolean) {
    setPrivacyAgreed(checked);
    setTermsAgreed(checked);
    setAgeConfirmed(checked);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/#/ko/home" aria-label="선배 홈">
          <img src="/seonbae-logo-antique.png" alt="" />
          <span className={styles.brandKo}>선배</span>
          <span className={styles.brandRule} />
          <span className={styles.brandEn}>
            SEONBAE<small>EST. 2026</small>
          </span>
        </Link>
        <Link className={styles.back} href="/#/ko/home">
          홈으로 돌아가기 <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.authHero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>SEONBAE LEARNING PORTAL</p>
          <h1>
            수업의 흐름을
            <br />
            <em>한곳에서.</em>
          </h1>
          <p className={styles.intro}>
            예정된 수업, 담당 튜터, 수업 시간과 전달 사항을 한눈에 확인하세요.
            상담에서 시작된 학습 계획이 실제 수업까지 끊기지 않도록 정리합니다.
          </p>
          <div className={styles.benefits}>
            <article>
              <span>01</span>
              <div>
                <b>월간 수업 일정</b>
                <p>한 달 전체 수업과 변경 사항을 달력에서 확인합니다.</p>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <b>담당 튜터 정보</b>
                <p>수업별 담당 튜터와 과목을 바로 확인합니다.</p>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <b>중앙 관리</b>
                <p>선배 팀이 업데이트한 일정이 포털에 반영됩니다.</p>
              </div>
            </article>
          </div>
        </div>

        <div className={styles.loginSurface}>
          <div className={styles.formHeading}>
            <div className={styles.formHeadingTop}>
              {action !== "signin" && (
                <button
                  type="button"
                  className={styles.formBack}
                  onClick={() => switchAction("signin")}
                  aria-label="로그인으로 돌아가기"
                  title="로그인으로 돌아가기"
                >
                  <span aria-hidden="true">←</span>
                </button>
              )}
              <h2>{actionCopy[action].title}</h2>
            </div>
            <span>{actionCopy[action].description}</span>
          </div>

          <form onSubmit={handleSubmit}>
            {action === "signin" && (
              <>
                <button
                  className={styles.googleButton}
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={busy || googleBusy}
                >
                  <GoogleIcon />
                  <span>{googleBusy ? "Google 연결 중..." : "Google로 로그인"}</span>
                </button>
                <div className={styles.authDivider}><span>또는 이메일로</span></div>
              </>
            )}

            {isSignup && (
              <>
                <div className={styles.googleSignup}>
                  <button
                    className={styles.googleButton}
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={busy || googleBusy}
                  >
                    <GoogleIcon />
                    <span>
                      {googleBusy ? "Google 연결 중..." : "Google 계정으로 회원가입"}
                    </span>
                  </button>
                  <small>
                    아래 계정 유형, 휴대전화번호와 필수 동의를 먼저 입력하면 Google의
                    이름·이메일로 가입합니다. 튜터 권한은 선배 명부 이메일이 확인된
                    계정에만 자동 부여됩니다.
                  </small>
                </div>
                <div className={styles.authDivider}>
                  <span>또는 이메일과 비밀번호로 가입</span>
                </div>
                <fieldset className={styles.accountRole}>
                  <legend>계정 유형</legend>
                  <label data-selected={accountRole === "student"}>
                    <input
                      type="radio"
                      name="account-role"
                      value="student"
                      checked={accountRole === "student"}
                      onChange={() => setAccountRole("student")}
                    />
                    <span><b>학생 계정</b><small>수업 일정, Zoom, 튜터 채팅</small></span>
                  </label>
                  <label data-selected={accountRole === "parent"}>
                    <input
                      type="radio"
                      name="account-role"
                      value="parent"
                      checked={accountRole === "parent"}
                      onChange={() => setAccountRole("parent")}
                    />
                    <span><b>보호자 계정</b><small>자녀 리포트, 일정, 결제 관리</small></span>
                  </label>
                </fieldset>
              </>
            )}

            {(isSignup || isRecovery) && (
              <label>
                <span>이름</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
            )}

            {(action === "signin" || isSignup || action === "reset-password") && (
              <label>
                <span>{action === "signin" ? "아이디 또는 이메일" : "이메일"}</span>
                <input
                  type={action === "signin" ? "text" : "email"}
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  autoComplete={action === "signin" ? "username" : "email"}
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={254}
                  required
                />
              </label>
            )}

            {(isSignup || isRecovery) && (
              <label>
                <span>휴대전화번호</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(sanitizePhoneInput(event.target.value))}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="01012345678"
                  maxLength={24}
                  required
                />
                <small className={styles.fieldNote}>
                  {action === "find-id"
                    ? "가입 정보가 일치하면 등록된 이메일로 보안 로그인 링크를 보냅니다."
                    : "아이디 확인과 비밀번호 재설정에 사용합니다. 해외 번호는 +국가번호를 입력해 주세요."}
                </small>
              </label>
            )}

            {(action === "signin" || isSignup) && (
              <label>
                <span>비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={action === "signin" ? "current-password" : "new-password"}
                  minLength={isSignup ? 12 : undefined}
                  maxLength={128}
                  required
                />
              </label>
            )}

            {isSignup && (
              <>
                <div className={styles.passwordPolicy} aria-live="polite">
                  <p>비밀번호 조건</p>
                  <ul>
                    <li data-valid={passwordChecks.length}>12자 이상</li>
                    <li data-valid={passwordChecks.lower && passwordChecks.upper}>
                      영문 소문자와 대문자
                    </li>
                    <li data-valid={passwordChecks.number}>숫자</li>
                    <li data-valid={passwordChecks.symbol}>특수문자</li>
                    <li data-valid={passwordChecks.allowed}>공백 없이 허용된 문자만 사용</li>
                  </ul>
                  <div className={styles.allowedSymbols}>
                    <span>허용 특수문자</span>
                    <code>{PASSWORD_ALLOWED_SYMBOLS}</code>
                  </div>
                </div>
                <label>
                  <span>비밀번호 확인</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={128}
                    required
                  />
                </label>
                <div className={styles.consentSummary}>
                  <b>필수 개인정보 수집·이용 안내</b>
                  <dl>
                    <div>
                      <dt>수집 항목</dt>
                      <dd>이름, 이메일, 휴대전화번호, 인증·동의 기록</dd>
                    </div>
                    <div>
                      <dt>이용 목적</dt>
                      <dd>회원 관리, 포털 제공, 등록 이메일을 통한 계정 복구, 비밀번호 재설정</dd>
                    </div>
                    <div>
                      <dt>보유 기간</dt>
                      <dd>회원 탈퇴 시까지. 법령상 보존 의무가 있으면 해당 기간까지</dd>
                    </div>
                  </dl>
                  <p>
                    동의를 거부할 수 있으나, 필수 정보이므로 동의하지 않으면 회원가입이 어렵습니다.
                  </p>
                </div>
                <div className={styles.consentList}>
                  <div className={styles.consentAll}>
                    <input
                      id="all-required-consent"
                      type="checkbox"
                      checked={allRequiredAgreed}
                      onChange={(event) => setAllRequiredAgreements(event.target.checked)}
                      aria-controls="privacy-consent terms-consent age-confirmation"
                    />
                    <label htmlFor="all-required-consent">
                      <b>전체 동의</b>
                      <span>필수 약관과 개인정보 수집·이용에 모두 동의합니다.</span>
                    </label>
                  </div>
                  <div className={styles.consentRow}>
                    <input
                      id="privacy-consent"
                      type="checkbox"
                      checked={privacyAgreed}
                      onChange={(event) => setPrivacyAgreed(event.target.checked)}
                      required
                    />
                    <label htmlFor="privacy-consent">
                      <b>[필수]</b> 개인정보 수집·이용에 동의합니다.{" "}
                      <Link href="/privacy" target="_blank">전문 보기</Link>
                    </label>
                  </div>
                  <div className={styles.consentRow}>
                    <input
                      id="terms-consent"
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(event) => setTermsAgreed(event.target.checked)}
                      required
                    />
                    <label htmlFor="terms-consent">
                      <b>[필수]</b> 이용약관에 동의합니다.{" "}
                      <Link href="/terms" target="_blank">전문 보기</Link>
                    </label>
                  </div>
                  <div className={styles.consentRow}>
                    <input
                      id="age-confirmation"
                      type="checkbox"
                      checked={ageConfirmed}
                      onChange={(event) => setAgeConfirmed(event.target.checked)}
                      required
                    />
                    <label htmlFor="age-confirmation">
                      <b>[필수]</b> 만 14세 이상이거나, 만 14세 미만 학생을 위한 법정대리인으로 가입합니다.
                    </label>
                  </div>
                </div>
              </>
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

            {message && (
              <p className={styles.formMessage} role="status">
                {message}
              </p>
            )}
            <button className={styles.submit} type="submit" disabled={busy}>
              <span>{busy ? "확인 중..." : actionCopy[action].submit}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          {action === "signin" && (
            <div className={styles.recoveryLinks} aria-label="계정 찾기">
              <button type="button" onClick={() => switchAction("find-id")}>
                아이디 찾기
              </button>
              <span aria-hidden="true">·</span>
              <button type="button" onClick={() => switchAction("reset-password")}>
                비밀번호 재설정
              </button>
            </div>
          )}

          <div className={styles.authFooter}>
            <span>
              {action === "signin"
                ? "아직 계정이 없으신가요?"
                : isSignup
                  ? "이미 계정이 있으신가요?"
                  : "계정이 기억나셨나요?"}
            </span>
            <button
              type="button"
              onClick={() => switchAction(action === "signin" ? "signup" : "signin")}
            >
              {action === "signin" ? "회원가입" : "로그인"}
            </button>
          </div>
          <div className={styles.legalLinks}>
            <Link href="/privacy">개인정보 처리방침</Link>
            <Link href="/terms">이용약관</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.64-2.43l-3.24-2.54c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.86a6 6 0 0 1 0-3.72V7.52H3.04a10 10 0 0 0 0 8.96l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.01c1.47 0 2.79.5 3.83 1.5l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"
      />
    </svg>
  );
}

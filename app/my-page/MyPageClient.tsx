"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./my-page.module.css";

export type MyPageProfile = {
  name: string;
  email: string;
  phone: string | null;
  role: "student" | "parent" | "tutor" | "admin";
  createdAt: string;
  privacyVersion: string | null;
  privacyConsentedAt: string | null;
  termsVersion: string | null;
  termsAgreedAt: string | null;
};

export default function MyPageClient({ profile }: { profile: MyPageProfile }) {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDarkMode(document.documentElement.dataset.theme === "dark");
  }, []);

  function updateTheme(enabled: boolean) {
    const theme = enabled ? "dark" : "light";
    setDarkMode(enabled);
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem("seonbae-theme", theme);
    } catch {
      // The preference still applies for this page when storage is unavailable.
    }
  }

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
    } finally {
      router.replace("/");
      router.refresh();
    }
  }

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !window.confirm(
        "계정을 삭제하면 포털 정보와 수업 기록을 더 이상 확인할 수 없습니다. 계속하시겠습니까?",
      )
    ) {
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmation }),
      });
      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "계정을 삭제하지 못했습니다.");
        return;
      }

      router.replace(result.destination || "/");
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
        <Link className={styles.brand} href="/">
          <img src="/logo.png" alt="" width="40" height="40" />
          <span>
            <b>Seonbae</b>
            <small>MY PAGE</small>
          </span>
        </Link>
        <nav>
          <Link href={portalDestination(profile.role)}>{profile.role === "admin" ? "관리자 콘솔" : "포털"}</Link>
          <button type="button" onClick={signOut} disabled={busy}>
            로그아웃
          </button>
        </nav>
      </header>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.identity}>
            <span className={styles.avatar}>{initials(profile.name)}</span>
            <div>
              <small>로그인 계정</small>
              <strong>{profile.name}</strong>
              <p>{profile.email}</p>
            </div>
          </div>
          <nav aria-label="마이페이지 메뉴">
            <a href="#info">내 정보</a>
            <a href="#policies">정책</a>
            <a href="#settings">설정</a>
            <button type="button" onClick={signOut} disabled={busy}>
              로그아웃
            </button>
          </nav>
        </aside>

        <div className={styles.content}>
          <header className={styles.intro}>
            <p>SEONBAE ACCOUNT</p>
            <h1>마이페이지</h1>
            <span>계정 정보와 서비스 설정을 한곳에서 관리하세요.</span>
          </header>

          <section className={styles.section} id="info">
            <div className={styles.sectionHeading}>
              <span>01</span>
              <div>
                <p>PROFILE</p>
                <h2>내 정보</h2>
              </div>
            </div>
            <dl className={styles.infoGrid}>
              <div>
                <dt>이름</dt>
                <dd>{profile.name}</dd>
              </div>
              <div>
                <dt>이메일</dt>
                <dd>{profile.email}</dd>
              </div>
              <div>
                <dt>휴대전화번호</dt>
                <dd>{formatPhone(profile.phone)}</dd>
              </div>
              <div>
                <dt>계정 유형</dt>
                <dd>{roleLabel(profile.role)}</dd>
              </div>
              <div>
                <dt>가입일</dt>
                <dd>{formatDate(profile.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.section} id="policies">
            <div className={styles.sectionHeading}>
              <span>02</span>
              <div>
                <p>POLICIES</p>
                <h2>정책</h2>
              </div>
            </div>
            <div className={styles.policyGrid}>
              <Link href="/privacy">
                <div>
                  <b>개인정보 처리방침</b>
                  <small>
                    {profile.privacyConsentedAt
                      ? `${formatDate(profile.privacyConsentedAt)} 동의`
                      : "전문 확인"}
                  </small>
                </div>
                <span>{profile.privacyVersion || "보기"} ↗</span>
              </Link>
              <Link href="/terms">
                <div>
                  <b>이용약관</b>
                  <small>
                    {profile.termsAgreedAt
                      ? `${formatDate(profile.termsAgreedAt)} 동의`
                      : "전문 확인"}
                  </small>
                </div>
                <span>{profile.termsVersion || "보기"} ↗</span>
              </Link>
            </div>
          </section>

          <section className={styles.section} id="settings">
            <div className={styles.sectionHeading}>
              <span>03</span>
              <div>
                <p>SETTINGS</p>
                <h2>설정</h2>
              </div>
            </div>
            <div className={styles.settingRow}>
              <div>
                <b>다크 모드</b>
                <p>이 기기에서 선배 화면을 어두운 색상으로 표시합니다.</p>
              </div>
              <button
                type="button"
                className={styles.switch}
                role="switch"
                aria-checked={darkMode}
                onClick={() => updateTheme(!darkMode)}
              >
                <span />
                <em>{darkMode ? "켜짐" : "꺼짐"}</em>
              </button>
            </div>

            <div className={styles.danger}>
              <div>
                <p>DANGER ZONE</p>
                <h3>계정 삭제</h3>
                {profile.role === "admin" ? (
                  <span>
                    서비스 운영을 보호하기 위해 관리자 계정은 마이페이지에서 삭제할 수
                    없습니다.
                  </span>
                ) : (
                  <span>
                    계정과 연결된 프로필·포털 기록이 삭제됩니다. 법령상 보존 의무가
                    있는 정보와 제한된 기간의 백업은 예외일 수 있습니다.
                  </span>
                )}
              </div>

              {profile.role !== "admin" && (
                <form onSubmit={deleteAccount}>
                  <label>
                    <span>현재 비밀번호</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <label>
                    <span>확인을 위해 ‘회원탈퇴’를 입력하세요</span>
                    <input
                      type="text"
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      autoComplete="off"
                      required
                    />
                  </label>
                  {message && (
                    <p className={styles.message} role="status">
                      {message}
                    </p>
                  )}
                  <button
                    className={styles.deleteButton}
                    type="submit"
                    disabled={busy || !password || confirmation !== "회원탈퇴"}
                  >
                    {busy ? "처리 중..." : "계정 영구 삭제"}
                  </button>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function initials(value: string) {
  const clean = value.trim();
  if (!clean) return "선";
  if (/^[가-힣]/.test(clean)) return clean.slice(-2);
  return clean
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function portalDestination(role: MyPageProfile["role"]) {
  if (role === "admin") return "/admin";
  if (role === "tutor") return "/portal/tutor";
  return "/portal";
}

function roleLabel(role: MyPageProfile["role"]) {
  if (role === "admin") return "관리자";
  if (role === "tutor") return "튜터";
  if (role === "parent") return "보호자";
  return "학생";
}

function formatDate(value: string | null) {
  if (!value) return "기록 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function formatPhone(value: string | null) {
  if (!value) return "등록되지 않음";
  if (value.startsWith("+8210") && value.length === 13) {
    return `0${value.slice(3)}`;
  }
  return value.replace(/-/g, "");
}

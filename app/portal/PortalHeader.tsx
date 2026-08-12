"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import styles from "./portal.module.css";

export type PortalHeaderUser = {
  name: string;
  email: string;
  role: "student" | "parent";
};

export default function PortalHeader({
  user,
  active = "overview",
}: {
  user: PortalHeaderUser;
  active?: "overview" | "homework" | "tutors" | "family" | "reports" | "billing";
}) {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDetailsElement>(null);

  function setProfileMenuOpen(open: boolean) {
    if (profileMenuRef.current) profileMenuRef.current.open = open;
  }

  async function signOut() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <header className={styles.topbar}>
      <Link className={styles.brand} href="/">
        <img src="/seonbae-logo-antique.png" alt="" />
        <span>
          <b>선배</b>
          <small>{user.role === "parent" ? "FAMILY PORTAL" : "STUDENT PORTAL"}</small>
        </span>
      </Link>

      <nav
        className={styles.portalNav}
        aria-label={user.role === "parent" ? "보호자 포털 메뉴" : "학생 포털 메뉴"}
      >
          <Link href="/portal" aria-current={active === "overview" ? "page" : undefined}>
            {user.role === "parent" ? "가족 일정" : "오늘 · 일정"}
          </Link>
          <Link href="/portal/homework" aria-current={active === "homework" ? "page" : undefined}>
            숙제
          </Link>
          {user.role === "student" && (
            <Link href="/portal/tutors" aria-current={active === "tutors" ? "page" : undefined}>
              내 튜터
            </Link>
          )}
          {user.role === "parent" && (
            <>
          <Link href="/portal/family" aria-current={active === "family" ? "page" : undefined}>
            학생 연결
          </Link>
          <Link href="/portal/reports" aria-current={active === "reports" ? "page" : undefined}>
            수업 리포트
          </Link>
          <Link href="/portal/billing" aria-current={active === "billing" ? "page" : undefined}>
            결제
          </Link>
            </>
          )}
      </nav>

      <div className={styles.account}>
        <details
          ref={profileMenuRef}
          className={styles.profileMenu}
          onMouseEnter={() => setProfileMenuOpen(true)}
          onMouseLeave={() => setProfileMenuOpen(false)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setProfileMenuOpen(false);
            }
          }}
        >
          <summary
            onClick={(event) => {
              if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                event.preventDefault();
              }
            }}
          >
            <span className={styles.avatar}>{initials(user.name)}</span>
            <span className={styles.accountMeta}>
              <small>로그인 계정</small>
              <b>{user.name}</b>
            </span>
            <span className={styles.profileChevron} aria-hidden="true">▾</span>
          </summary>
          <div>
            <Link href="/my-page#info">내 정보</Link>
            <Link href="/my-page#policies">정책</Link>
            <Link href="/my-page#settings">설정</Link>
            <button type="button" onClick={signOut}>로그아웃</button>
          </div>
        </details>
        <button type="button" onClick={signOut}>로그아웃</button>
      </div>
    </header>
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

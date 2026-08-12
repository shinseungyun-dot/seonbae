"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useSeonbaeLocale } from "../../utils/i18n/client";
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
  const locale = useSeonbaeLocale();
  const l = (ko: string, en: string) => locale === "ko" ? ko : en;

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

  const portalLabel = user.role === "parent"
    ? l("보호자 포털", "FAMILY PORTAL")
    : l("학생 포털", "STUDENT PORTAL");

  return (
    <header className={styles.topbar}>
      <Link className={styles.brand} href="/">
        <img src="/seonbae-logo-antique.png" alt="" />
        <span>
          <b>{l("선배", "Seonbae")}</b>
          <small>{portalLabel}</small>
        </span>
      </Link>

      <nav
        className={styles.portalNav}
        aria-label={user.role === "parent" ? l("보호자 포털 메뉴", "Parent portal menu") : l("학생 포털 메뉴", "Student portal menu")}
      >
          <Link href="/portal" aria-current={active === "overview" ? "page" : undefined}>
            {user.role === "parent" ? l("가족 일정", "Family calendar") : l("오늘 · 일정", "Overview")}
          </Link>
          <Link href="/portal/homework" aria-current={active === "homework" ? "page" : undefined}>
            {l("숙제", "Homework")}
          </Link>
          {user.role === "student" && (
            <Link href="/portal/tutors" aria-current={active === "tutors" ? "page" : undefined}>
              {l("내 튜터", "My tutors")}
            </Link>
          )}
          {user.role === "parent" && (
            <>
          <Link href="/portal/family" aria-current={active === "family" ? "page" : undefined}>
            {l("학생 연결", "Students")}
          </Link>
          <Link href="/portal/reports" aria-current={active === "reports" ? "page" : undefined}>
            {l("수업 리포트", "Reports")}
          </Link>
          <Link href="/portal/billing" aria-current={active === "billing" ? "page" : undefined}>
            {l("결제", "Billing")}
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
              <small>{l("로그인 계정", "Signed in")}</small>
              <b>{user.name}</b>
            </span>
            <span className={styles.profileChevron} aria-hidden="true">▾</span>
          </summary>
          <div>
            <Link href="/my-page#info">{l("내 정보", "My information")}</Link>
            <Link href="/my-page#policies">{l("정책", "Policies")}</Link>
            <Link href="/my-page#settings">{l("설정", "Settings")}</Link>
            <button type="button" onClick={signOut}>{l("로그아웃", "Log out")}</button>
          </div>
        </details>
        <button type="button" onClick={signOut}>{l("로그아웃", "Log out")}</button>
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

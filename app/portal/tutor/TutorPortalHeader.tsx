"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import styles from "../portal.module.css";

export type TutorHeaderUser = {
  name: string;
  email: string;
  registryId: string;
};

export default function TutorPortalHeader({
  tutor,
  active = "overview",
}: {
  tutor: TutorHeaderUser;
  active?: "overview" | "homework" | "verification";
}) {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDetailsElement>(null);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className={styles.topbar}>
      <Link className={styles.brand} href="/portal/tutor">
        <img src="/seonbae-logo-antique.png" alt="" />
        <span><b>선배</b><small>TUTOR PORTAL</small></span>
      </Link>
      <nav className={styles.portalNav} aria-label="튜터 포털 메뉴">
        <Link href="/portal/tutor" aria-current={active === "overview" ? "page" : undefined}>개요</Link>
        <Link href="/portal/tutor/homework" aria-current={active === "homework" ? "page" : undefined}>숙제</Link>
        <Link href="/portal/tutor/verification" aria-current={active === "verification" ? "page" : undefined}>자격 검증</Link>
      </nav>
      <div className={styles.account}>
        <details
          ref={profileMenuRef}
          className={styles.profileMenu}
          onMouseEnter={() => { if (profileMenuRef.current) profileMenuRef.current.open = true; }}
          onMouseLeave={() => { if (profileMenuRef.current) profileMenuRef.current.open = false; }}
        >
          <summary>
            <span className={styles.avatar}>{initials(tutor.name)}</span>
            <span className={styles.accountMeta}><small>{tutor.registryId}</small><b>{tutor.name}</b></span>
            <span className={styles.profileChevron} aria-hidden="true">▾</span>
          </summary>
          <div>
            <Link href="/my-page#info">내 정보</Link>
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
  return clean.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}

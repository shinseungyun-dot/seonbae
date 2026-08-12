"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useSeonbaeLocale } from "../../../utils/i18n/client";
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
  const locale = useSeonbaeLocale();
  const l = (ko: string, en: string) => locale === "ko" ? ko : en;

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
    <div className={styles.utilityBar}>
      <div>
        <span>EDUCATION TO THE WORLD</span>
        <Link href="/">{l("웹사이트로", "Back to website")} <i aria-hidden="true">↗</i></Link>
      </div>
    </div>
    <header className={styles.topbar}>
      <Link className={styles.brand} href="/portal/tutor">
        <img src="/logo.png" alt="" width="36" height="36" />
        <span><b>Seonbae</b><small>{l("튜터 포털", "TUTOR PORTAL")}</small></span>
      </Link>
      <nav className={styles.portalNav} aria-label={l("튜터 포털 메뉴", "Tutor portal menu")}>
        <Link href="/portal/tutor" aria-current={active === "overview" ? "page" : undefined}>{l("개요", "Overview")}</Link>
        <Link href="/portal/tutor/homework" aria-current={active === "homework" ? "page" : undefined}>{l("숙제", "Homework")}</Link>
        <Link href="/portal/tutor/verification" aria-current={active === "verification" ? "page" : undefined}>{l("자격 검증", "Verification")}</Link>
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
            <Link href="/my-page#info">{l("내 정보", "My information")}</Link>
            <Link href="/my-page#settings">{l("설정", "Settings")}</Link>
            <button type="button" onClick={signOut}>{l("로그아웃", "Log out")}</button>
          </div>
        </details>
        <button type="button" onClick={signOut}>{l("로그아웃", "Log out")}</button>
      </div>
    </header>
    </>
  );
}

function initials(value: string) {
  const clean = value.trim();
  if (!clean) return "선";
  if (/^[가-힣]/.test(clean)) return clean.slice(-2);
  return clean.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}

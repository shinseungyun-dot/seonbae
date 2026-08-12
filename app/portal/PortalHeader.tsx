"use client";

import { useRouter } from "next/navigation";
import { useSeonbaeLocale } from "../../utils/i18n/client";
import PortalSidebar, { type PortalSidebarItem } from "./PortalSidebar";

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
  const locale = useSeonbaeLocale();
  const l = (ko: string, en: string) => locale === "ko" ? ko : en;

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

  const items: PortalSidebarItem[] = [
    {
      href: "/portal",
      label: user.role === "parent" ? l("가족 일정", "Family calendar") : l("오늘과 일정", "Overview"),
      icon: user.role === "parent" ? "calendar" : "overview",
      active: active === "overview",
    },
    { href: "/portal/homework", label: l("숙제", "Homework"), icon: "homework", active: active === "homework" },
  ];

  if (user.role === "student") {
    items.push({ href: "/portal/tutors", label: l("내 튜터", "My tutors"), icon: "tutors", active: active === "tutors" });
  } else {
    items.push(
      { href: "/portal/family", label: l("학생 연결", "Students"), icon: "students", active: active === "family" },
      { href: "/portal/reports", label: l("수업 리포트", "Reports"), icon: "reports", active: active === "reports" },
      { href: "/portal/billing", label: l("결제", "Billing"), icon: "billing", active: active === "billing" },
    );
  }

  return (
    <PortalSidebar
      roleLabel={user.role === "parent" ? l("보호자 포털", "Family portal") : l("학생 포털", "Student portal")}
      navigationLabel={user.role === "parent" ? l("보호자 포털 메뉴", "Parent portal menu") : l("학생 포털 메뉴", "Student portal menu")}
      homeHref="/portal"
      user={{ name: user.name, email: user.email }}
      items={items}
      labels={{
        expand: l("사이드바 펼치기", "Expand sidebar"),
        collapse: l("사이드바 접기", "Collapse sidebar"),
        open: l("포털 메뉴 열기", "Open portal menu"),
        close: l("포털 메뉴 닫기", "Close portal menu"),
        website: l("웹사이트로", "Back to website"),
        account: l("로그인 계정", "Signed in"),
        information: l("내 정보", "My information"),
        policies: l("정책", "Policies"),
        settings: l("설정", "Settings"),
        signOut: l("로그아웃", "Log out"),
      }}
      onSignOut={signOut}
    />
  );
}

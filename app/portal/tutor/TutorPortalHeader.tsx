"use client";

import { useRouter } from "next/navigation";
import { useSeonbaeLocale } from "../../../utils/i18n/client";
import PortalSidebar, { type PortalSidebarItem } from "../PortalSidebar";

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
  const locale = useSeonbaeLocale();
  const l = (ko: string, en: string) => locale === "ko" ? ko : en;

  async function signOut() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const items: PortalSidebarItem[] = [
    { href: "/portal/tutor", label: l("개요", "Overview"), icon: "overview", active: active === "overview" },
    { href: "/portal/tutor/homework", label: l("숙제", "Homework"), icon: "homework", active: active === "homework" },
    { href: "/portal/tutor/verification", label: l("자격 검증", "Verification"), icon: "verification", active: active === "verification" },
  ];

  return (
    <PortalSidebar
      roleLabel={l("튜터 포털", "Tutor portal")}
      navigationLabel={l("튜터 포털 메뉴", "Tutor portal menu")}
      homeHref="/portal/tutor"
      user={{ name: tutor.name, email: tutor.email, detail: tutor.registryId }}
      items={items}
      labels={{
        expand: l("사이드바 펼치기", "Expand sidebar"),
        collapse: l("사이드바 접기", "Collapse sidebar"),
        open: l("포털 메뉴 열기", "Open portal menu"),
        close: l("포털 메뉴 닫기", "Close portal menu"),
        website: l("웹사이트로", "Back to website"),
        account: l("튜터 계정", "Tutor account"),
        information: l("내 정보", "My information"),
        policies: l("정책", "Policies"),
        settings: l("설정", "Settings"),
        signOut: l("로그아웃", "Log out"),
      }}
      onSignOut={signOut}
    />
  );
}

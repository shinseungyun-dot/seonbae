import { redirect } from "next/navigation";
import { createClient } from "../../../utils/supabase/server";
import PortalHeader from "../PortalHeader";
import FamilyLinkClient, { type LinkedStudent } from "./FamilyLinkClient";
import styles from "../parent.module.css";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") redirect("/portal");

  const { data: links } = await supabase
    .from("parent_student_links")
    .select("student_id,created_at")
    .eq("parent_id", user.id)
    .order("created_at", { ascending: true });
  const studentIds = (links ?? []).map((link) => link.student_id);
  const { data: students } = studentIds.length
    ? await supabase
        .from("profiles")
        .select("id,full_name,email,phone")
        .in("id", studentIds)
    : { data: [] };

  const linkedStudents: LinkedStudent[] = (students ?? []).map((student) => ({
    id: student.id,
    name: student.full_name || "학생",
    email: maskEmail(student.email || ""),
    phone: maskPhone(student.phone),
  }));

  const portalUser = {
    name:
      profile.full_name
      || user.user_metadata?.full_name
      || user.email?.split("@")[0]
      || "보호자",
    email: profile.email || user.email || "",
    role: "parent" as const,
  };

  return (
    <main className={styles.page}>
      <PortalHeader user={portalUser} active="family" />
      <div className={styles.shell}>
        <header className={styles.pageHeading}>
          <p>FAMILY CONNECTION</p>
          <h1>학생 계정 연결</h1>
          <span>학생에게 전송된 일회용 인증번호 또는 승인 링크로 가족 관계를 확인합니다.</span>
        </header>
        <FamilyLinkClient linkedStudents={linkedStudents} />
      </div>
    </main>
  );
}

function maskEmail(value: string) {
  const [name, domain] = value.split("@");
  if (!domain) return "등록 이메일 없음";
  return `${name.slice(0, 2)}•••@${domain}`;
}

function maskPhone(value: string | null) {
  const digits = value?.replace(/\D/g, "") || "";
  return digits ? `•••• ${digits.slice(-4)}` : "등록 번호 없음";
}

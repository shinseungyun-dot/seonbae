import { redirect } from "next/navigation";
import { createClient } from "../../../../utils/supabase/server";
import TutorPortalHeader from "../TutorPortalHeader";
import CredentialSubmissionForm, { type TutorCredential } from "./CredentialSubmissionForm";
import styles from "./verification.module.css";

export const dynamic = "force-dynamic";

export default async function TutorVerificationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,role,tutor_registry_id,account_status")
    .eq("id", user.id)
    .single();
  if (profile?.account_status !== "approved") redirect("/portal/pending");
  if (profile?.role !== "tutor" || !profile.tutor_registry_id) redirect("/portal");

  const { data: rows } = await supabase
    .from("tutor_credentials")
    .select("id,credential_type,title,issuer,score,issued_on,proof_name,status,display_on_profile,review_note,created_at")
    .eq("tutor_id", user.id)
    .order("created_at", { ascending: false });
  const credentials = (rows ?? []) as TutorCredential[];
  const tutor = {
    name: profile.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "튜터",
    email: profile.email || user.email || "",
    registryId: profile.tutor_registry_id,
  };

  return (
    <main className={styles.page}>
      <TutorPortalHeader tutor={tutor} active="verification" />
      <section className={styles.shell}>
        <header className={styles.heading}>
          <div><p>VERIFICATION</p><h1>자격 검증</h1><span>재학·졸업 증명, 자격증과 시험 성적 원본을 제출합니다.</span></div>
          <aside><b>프로필 반영 기준</b><span>선배 팀 승인 자료만 검증 배지와 함께 공개 프로필에 표시됩니다.</span></aside>
        </header>
        <CredentialSubmissionForm credentials={credentials} />
      </section>
    </main>
  );
}


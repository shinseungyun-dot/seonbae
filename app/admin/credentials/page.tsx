import { redirect } from "next/navigation";
import { createAdminClient } from "../../../utils/supabase/admin";
import { createClient } from "../../../utils/supabase/server";
import ApplicationReviewClient, {
  type CredentialApplication,
} from "../applications/ApplicationReviewClient";
import AdminSidebar from "../AdminSidebar";
import styles from "../applications/applications.module.css";

export const dynamic = "force-dynamic";

// Credential review is its own queue now that it no longer shares a page with
// account sign-ups.
export default async function AdminCredentialsPage() {
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
  if (profile?.role !== "admin") redirect("/portal");

  const admin = createAdminClient();
  const { data: credentialRows } = await admin
    .from("tutor_credentials")
    .select(
      "id,tutor_id,tutor_registry_id,credential_type,title,issuer,score,issued_on,proof_name,proof_path,status,created_at",
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const tutorIds = Array.from(new Set((credentialRows ?? []).map((item) => item.tutor_id)));
  const tutorNames = new Map<string, string>();
  if (tutorIds.length) {
    const { data: tutors } = await admin
      .from("profiles")
      .select("id,full_name,email")
      .in("id", tutorIds);
    for (const tutor of tutors ?? []) {
      tutorNames.set(tutor.id, tutor.full_name || tutor.email || "튜터");
    }
  }

  const credentials: CredentialApplication[] = await Promise.all(
    (credentialRows ?? []).map(async (item) => {
      const signed = await admin.storage
        .from("tutor-credentials")
        .createSignedUrl(item.proof_path, 60 * 60);
      return {
        ...item,
        tutorName: tutorNames.get(item.tutor_id) || "튜터",
        documentUrl: signed.data?.signedUrl || null,
      };
    }),
  );

  return (
    <main className={styles.page}>
      <AdminSidebar
        active="credentials"
        adminName={profile.full_name || profile.email || "관리자"}
        styles={styles}
      />
      <section className={styles.main}>
        <header className={styles.heading}>
          <div>
            <p>TUTOR CREDENTIALS</p>
            <h1>자격 검증</h1>
            <span>성적표와 자격 증빙 원본을 확인하고 승인합니다.</span>
          </div>
          <b>{credentials.length}건 대기</b>
        </header>
        <ApplicationReviewClient accounts={[]} credentials={credentials} show="credentials" />
      </section>
    </main>
  );
}

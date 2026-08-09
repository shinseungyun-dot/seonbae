import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "../../../utils/supabase/admin";
import { createClient } from "../../../utils/supabase/server";
import ApplicationReviewClient, { type AccountApplication, type CredentialApplication } from "./ApplicationReviewClient";
import styles from "./applications.module.css";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
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
  const [{ data: accountRows }, { data: credentialRows }] = await Promise.all([
    admin
      .from("account_creation_requests")
      .select("id,user_id,full_name,email,phone,requested_role,acceptance_letter_path,acceptance_letter_name,status,notification_sent_at,notification_error,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    admin
      .from("tutor_credentials")
      .select("id,tutor_id,tutor_registry_id,credential_type,title,issuer,score,issued_on,proof_name,proof_path,status,created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const tutorIds = Array.from(new Set((credentialRows ?? []).map((item) => item.tutor_id)));
  const tutorNames = new Map<string, string>();
  if (tutorIds.length) {
    const { data: tutors } = await admin.from("profiles").select("id,full_name,email").in("id", tutorIds);
    for (const tutor of tutors ?? []) tutorNames.set(tutor.id, tutor.full_name || tutor.email || "튜터");
  }

  const accounts: AccountApplication[] = await Promise.all((accountRows ?? []).map(async (item) => {
    const signed = await admin.storage.from("account-documents").createSignedUrl(item.acceptance_letter_path, 60 * 60);
    return { ...item, documentUrl: signed.data?.signedUrl || null };
  }));
  const credentials: CredentialApplication[] = await Promise.all((credentialRows ?? []).map(async (item) => {
    const signed = await admin.storage.from("tutor-credentials").createSignedUrl(item.proof_path, 60 * 60);
    return { ...item, tutorName: tutorNames.get(item.tutor_id) || "튜터", documentUrl: signed.data?.signedUrl || null };
  }));

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/admin"><img src="/seonbae-logo-antique.png" alt="" /><span><b>선배</b><small>ADMIN</small></span></Link>
        <nav><span>OPERATIONS</span><Link href="/admin">튜터 명부</Link><Link href="/admin/sessions">수업 · Zoom</Link><Link className={styles.active} href="/admin/applications">가입 · 검증 심사</Link></nav>
        <div><small>관리자</small><b>{profile.full_name || profile.email}</b></div>
      </aside>
      <section className={styles.main}>
        <header className={styles.heading}><div><p>ADMISSIONS DESK</p><h1>가입 · 검증 심사</h1><span>합격통지서와 튜터 자격 원본을 확인하고 승인합니다.</span></div><b>{accounts.length + credentials.length}건 대기</b></header>
        <ApplicationReviewClient accounts={accounts} credentials={credentials} />
      </section>
    </main>
  );
}


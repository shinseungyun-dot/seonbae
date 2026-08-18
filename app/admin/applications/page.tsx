import { redirect } from "next/navigation";
import { createAdminClient } from "../../../utils/supabase/admin";
import { createClient } from "../../../utils/supabase/server";
import ApplicationReviewClient, { type AccountApplication, type CredentialApplication } from "./ApplicationReviewClient";
import AdminSidebar from "../AdminSidebar";
import { TUTOR_CONTRACT_VERSION } from "../../../utils/contracts/tutor-contract";
import styles from "./applications.module.css";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
      .select("id,user_id,full_name,email,phone,requested_role,acceptance_letter_path,acceptance_letter_name,referral_code,status,notification_sent_at,notification_error,created_at")
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

  const pendingTutorIds = (accountRows ?? [])
    .filter((item) => item.requested_role === "tutor")
    .map((item) => item.user_id);
  const signedTutorIds = new Set<string>();
  if (pendingTutorIds.length) {
    const { data: signatures } = await admin
      .from("tutor_contract_signatures")
      .select("tutor_id")
      .in("tutor_id", pendingTutorIds)
      .eq("contract_version", TUTOR_CONTRACT_VERSION);
    for (const signature of signatures ?? []) signedTutorIds.add(signature.tutor_id);
  }

  const accounts: AccountApplication[] = await Promise.all((accountRows ?? []).map(async (item) => {
    if (!item.acceptance_letter_path) {
      return { ...item, contract_signed: item.requested_role !== "tutor" || signedTutorIds.has(item.user_id), documentUrl: null };
    }
    const signed = await admin.storage.from("account-documents").createSignedUrl(item.acceptance_letter_path, 60 * 60);
    return { ...item, contract_signed: item.requested_role !== "tutor" || signedTutorIds.has(item.user_id), documentUrl: signed.data?.signedUrl || null };
  }));
  const credentials: CredentialApplication[] = await Promise.all((credentialRows ?? []).map(async (item) => {
    const signed = await admin.storage.from("tutor-credentials").createSignedUrl(item.proof_path, 60 * 60);
    return { ...item, tutorName: tutorNames.get(item.tutor_id) || "튜터", documentUrl: signed.data?.signedUrl || null };
  }));

  return (
    <main className={styles.page}>
      <AdminSidebar active="applications" adminName={profile.full_name || profile.email || "관리자"} styles={styles} />
      <section className={styles.main}>
        <header className={styles.heading}>
          <div>
            <p>ADMISSIONS DESK</p>
            <h1>가입 · 검증 심사</h1>
            <span>모든 가입 요청과 튜터 자격 자료를 한곳에서 확인합니다.</span>
          </div>
          <b>{accounts.length + credentials.length}건 대기</b>
        </header>
        <ApplicationReviewClient accounts={accounts} credentials={credentials} />
      </section>
    </main>
  );
}

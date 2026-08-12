import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../utils/supabase/server";
import PendingLogoutButton from "./PendingLogoutButton";
import styles from "./pending.module.css";

export const dynamic = "force-dynamic";

export default async function PendingAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,email,role,account_status")
    .eq("id", user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.account_status === "approved") {
    redirect(profile.role === "tutor" ? "/portal/tutor" : "/portal");
  }

  const { data: request } = await supabase
    .from("account_creation_requests")
    .select("requested_role,status,acceptance_letter_name,created_at,review_note")
    .eq("user_id", user.id)
    .maybeSingle();

  const rejected = profile?.account_status === "rejected" || request?.status === "rejected";

  return (
    <main className={styles.page}>
      <header>
        <Link href="/" aria-label="선배 홈">
          <img src="/seonbae-logo-antique.png" alt="" />
          <span><b>선배</b><small>ACCOUNT REVIEW</small></span>
        </Link>
        <PendingLogoutButton />
      </header>
      <section className={styles.card}>
        <p>{rejected ? "REVIEW UPDATE" : "ADMISSIONS REVIEW"}</p>
        <h1>{rejected ? "추가 확인이 필요합니다." : "가입 심사가 진행 중입니다."}</h1>
        <span>
          {rejected
            ? "제출 정보를 보완한 뒤 admissions@seonbae.com으로 문의해 주세요."
            : "학교 이메일과 합격통지서를 선배 팀이 확인하고 있습니다. 승인되면 포털 기능이 열립니다."}
        </span>
        <dl>
          <div><dt>신청자</dt><dd>{profile?.full_name || profile?.email || user.email}</dd></div>
          <div><dt>계정 유형</dt><dd>{roleLabel(request?.requested_role || profile?.role)}</dd></div>
          <div><dt>학교 이메일</dt><dd>{profile?.email || user.email}</dd></div>
          <div><dt>제출 문서</dt><dd>{request?.acceptance_letter_name || "합격통지서 확인 중"}</dd></div>
          <div><dt>접수일</dt><dd>{request?.created_at ? formatDate(request.created_at) : "이메일 인증 후 접수"}</dd></div>
          <div><dt>상태</dt><dd className={rejected ? styles.rejected : styles.pending}>{rejected ? "보완 요청" : "검토 중"}</dd></div>
        </dl>
        {request?.review_note && <aside><b>심사팀 메모</b><p>{request.review_note}</p></aside>}
        <small>문의: <a href="mailto:admissions@seonbae.com">admissions@seonbae.com</a></small>
      </section>
    </main>
  );
}


function roleLabel(role?: string) {
  if (role === "parent") return "보호자";
  if (role === "tutor") return "튜터";
  return "학생";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    .format(new Date(value));
}

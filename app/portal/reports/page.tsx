import { redirect } from "next/navigation";
import { createClient } from "../../../utils/supabase/server";
import PortalHeader from "../PortalHeader";
import styles from "../parent.module.css";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
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
  if (profile?.account_status !== "approved") redirect("/portal/pending");
  if (profile?.role !== "parent") redirect("/portal");

  const { data: links } = await supabase
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", user.id);
  const studentIds = (links ?? []).map((link) => link.student_id);
  const studentNames = new Map<string, string>();
  if (studentIds.length) {
    const { data: students } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .in("id", studentIds);
    for (const student of students ?? []) {
      studentNames.set(student.id, student.full_name || student.email || "학생");
    }
  }

  const { data: sessions } = studentIds.length
    ? await supabase
        .from("portal_sessions")
        .select("id,user_id,session_date,duration_minutes,actual_minutes,subject,title,notes,zoom_status,tutors(name,university)")
        .in("user_id", studentIds)
        .eq("zoom_status", "ended")
        .order("session_date", { ascending: false })
    : { data: [] };

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
      <PortalHeader user={portalUser} active="reports" />
      <div className={styles.shell}>
        <header className={styles.pageHeading}>
          <p>LESSON REPORTS</p>
          <h1>수업 리포트</h1>
          <span>완료된 수업별 학습 내용과 튜터 전달 사항을 확인합니다.</span>
        </header>

        <section className={styles.reportLayout}>
          <aside className={styles.reportSummary}>
            <span>누적 완료</span>
            <strong>{sessions?.length ?? 0}</strong>
            <p>연결된 학생 {studentIds.length}명의 수업 기록</p>
          </aside>
          <div className={styles.reportList}>
            {sessions?.length ? sessions.map((session) => {
              const tutor = Array.isArray(session.tutors) ? session.tutors[0] : session.tutors;
              return (
                <article className={styles.reportCard} key={session.id}>
                  <header>
                    <div>
                      <time>{formatDate(session.session_date)}</time>
                      <h2>{session.title}</h2>
                    </div>
                    <span>{studentNames.get(session.user_id) || "학생"}</span>
                  </header>
                  <dl>
                    <div><dt>과목</dt><dd>{session.subject}</dd></div>
                    <div><dt>튜터</dt><dd>{tutor?.name || "담당 튜터"}</dd></div>
                    <div><dt>진행 시간</dt><dd>{formatMinutes(session.actual_minutes ?? session.duration_minutes)}</dd></div>
                  </dl>
                  <div className={styles.reportBody}>
                    <strong>수업 전달 사항</strong>
                    <p>{session.notes || "튜터가 수업 리포트를 작성 중입니다."}</p>
                  </div>
                </article>
              );
            }) : (
              <div className={`${styles.panel} ${styles.emptyState}`}>
                <strong>아직 완료된 수업 리포트가 없습니다.</strong>
                <p>수업이 완료되면 튜터 전달 사항과 진행 시간이 이곳에 쌓입니다.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (!hours) return `${minutes}분`;
  return minutes ? `${hours}시간 ${minutes}분` : `${hours}시간`;
}

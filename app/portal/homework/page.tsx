import { redirect } from "next/navigation";
import { createClient } from "../../../utils/supabase/server";
import PortalHeader from "../PortalHeader";
import HomeworkList, { type HomeworkItem } from "./HomeworkList";
import styles from "./homework.module.css";

export const dynamic = "force-dynamic";

export default async function HomeworkPage() {
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
  if (profile?.account_status !== "approved") redirect("/portal/pending");
  if (profile?.role === "tutor") redirect("/portal/tutor/homework");

  const isParent = profile?.role === "parent";
  let studentIds = [user.id];
  const studentNames = new Map<string, string>();
  if (isParent) {
    const { data: links } = await supabase
      .from("parent_student_links")
      .select("student_id")
      .eq("parent_id", user.id);
    studentIds = (links ?? []).map((link) => link.student_id);
  }
  if (studentIds.length) {
    const { data: students } = await supabase
      .from("profiles")
      .select("id,full_name,email")
      .in("id", studentIds);
    for (const student of students ?? []) {
      studentNames.set(student.id, student.full_name || student.email || "학생");
    }
  }

  const { data: rows } = studentIds.length
    ? await supabase
        .from("portal_assignments")
        .select("id,student_id,subject,title,instructions,due_date,attachment_name,status,submitted_at,feedback,graded_at,created_at,tutors(name)")
        .in("student_id", studentIds)
        .order("due_date", { ascending: true })
        .order("created_at", { ascending: false })
    : { data: [] };

  const assignments: HomeworkItem[] = (rows ?? []).map((row) => {
    const tutor = Array.isArray(row.tutors) ? row.tutors[0] : row.tutors;
    return {
      id: row.id,
      studentName: studentNames.get(row.student_id) || "학생",
      subject: row.subject,
      title: row.title,
      instructions: row.instructions,
      dueDate: row.due_date,
      attachmentName: row.attachment_name,
      status: row.status,
      submittedAt: row.submitted_at,
      feedback: row.feedback,
      gradedAt: row.graded_at,
      tutorName: tutor?.name || "담당 튜터",
    };
  });

  const portalUser = {
    name:
      profile?.full_name
      || user.user_metadata?.full_name
      || user.email?.split("@")[0]
      || (isParent ? "보호자" : "학생"),
    email: profile?.email || user.email || "",
    role: isParent ? ("parent" as const) : ("student" as const),
  };
  const openCount = assignments.filter((item) => item.status === "todo").length;
  const reviewCount = assignments.filter((item) => item.status === "submitted").length;

  return (
    <main className={styles.page}>
      <PortalHeader user={portalUser} active="homework" />
      <section className={styles.shell}>
        <header className={styles.heading}>
          <div>
            <p>HOMEWORK</p>
            <h1>{isParent ? "자녀 숙제 현황" : "내 숙제"}</h1>
            <span>
              {isParent
                ? "연결된 학생의 과제, 제출 상태와 튜터 피드백을 한곳에서 확인합니다."
                : "튜터가 등록한 과제를 확인하고 완료하면 제출 상태로 바꾸세요."}
            </span>
          </div>
          <dl>
            <div><dt>할 일</dt><dd>{openCount}</dd></div>
            <div><dt>검토 중</dt><dd>{reviewCount}</dd></div>
            <div><dt>피드백 완료</dt><dd>{assignments.length - openCount - reviewCount}</dd></div>
          </dl>
        </header>
        <HomeworkList assignments={assignments} role={isParent ? "parent" : "student"} />
      </section>
    </main>
  );
}


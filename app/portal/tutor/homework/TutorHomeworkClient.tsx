"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./tutor-homework.module.css";
import { usePortalText } from "../../PortalLocale";

type HomeworkStatus = "todo" | "submitted" | "graded";

export type TutorStudent = {
  id: string;
  name: string;
  email: string;
  subjects: string[];
};

export type TutorHomeworkItem = {
  id: number;
  studentId: string;
  studentName: string;
  subject: string;
  title: string;
  instructions: string;
  dueDate: string;
  attachmentName: string | null;
  status: HomeworkStatus;
  submittedAt: string | null;
  feedback: string | null;
  gradedAt: string | null;
};

export default function TutorHomeworkClient({
  students,
  assignments,
}: {
  students: TutorStudent[];
  assignments: TutorHomeworkItem[];
}) {
  const router = useRouter();
  const { locale, text: l } = usePortalText();
  const [studentId, setStudentId] = useState(students[0]?.id || "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const selectedStudent = useMemo(
    () => students.find((student) => student.id === studentId),
    [studentId, students],
  );

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    form.set("studentId", studentId);
    try {
      const response = await fetch("/api/homework", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || l("숙제를 등록하지 못했습니다.", "The homework could not be assigned."));
        return;
      }
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setMessage(l("네트워크 연결을 확인한 뒤 다시 시도해 주세요.", "Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  }

  async function grade(id: number) {
    const note = feedback[id]?.trim();
    if (!note) {
      setMessage(l("학생에게 전달할 피드백을 입력해 주세요.", "Enter feedback for the student."));
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grade", assignmentId: id, feedback: note }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || l("피드백을 저장하지 못했습니다.", "The feedback could not be saved."));
        return;
      }
      router.refresh();
    } catch {
      setMessage(l("네트워크 연결을 확인한 뒤 다시 시도해 주세요.", "Check your connection and try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.workspace}>
      <form className={styles.assignForm} onSubmit={assign}>
        <header><b>{l("새 숙제 등록", "Assign new homework")}</b><span>{l("등록 즉시 학생과 연결 보호자에게 표시됩니다.", "It appears immediately for the student and linked parent.")}</span></header>
        <label><span>{l("학생", "Student")}</span><select value={studentId} onChange={(event) => setStudentId(event.target.value)} required>
          {students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.email}</option>)}
        </select></label>
        <label><span>{l("과목", "Subject")}</span><select name="subject" required defaultValue="">
          <option value="" disabled>{l("과목 선택", "Choose a subject")}</option>
          {(selectedStudent?.subjects || []).map((subject) => <option key={subject}>{subject}</option>)}
        </select></label>
        <label className={styles.full}><span>{l("제목", "Title")}</span><input name="title" maxLength={180} required /></label>
        <label className={styles.full}><span>{l("안내", "Instructions")}</span><textarea name="instructions" rows={5} maxLength={5000} required /></label>
        <label><span>{l("마감일", "Due date")}</span><input name="dueDate" type="date" min={new Date().toISOString().slice(0, 10)} required /></label>
        <label><span>{l("첨부 파일", "Attachment")}</span><input name="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" /></label>
        {message && <p className={styles.error} role="alert">{message}</p>}
        <button className={styles.primary} type="submit" disabled={busy || !students.length}>
          {busy ? l("저장 중...", "Saving...") : l("숙제 등록", "Assign homework")}
        </button>
      </form>

      <section className={styles.assignmentList}>
        <header><div><p>ASSIGNMENT LOG</p><h2>{l("등록한 숙제", "Assigned homework")}</h2></div><span>{l(`${assignments.length}건`, `${assignments.length}`)}</span></header>
        {assignments.length ? assignments.map((item) => (
          <article key={item.id}>
            <div className={styles.cardTop}>
              <div><small>{item.studentName} · {item.subject}</small><h3>{item.title}</h3></div>
              <span data-status={item.status}>{statusLabel(item.status, locale)}</span>
            </div>
            <p>{item.instructions}</p>
            <footer>
              <time>{l("마감", "Due")} {formatDate(item.dueDate, locale)}</time>
              {item.attachmentName && <a href={`/api/homework?file=${item.id}`} target="_blank" rel="noreferrer">{item.attachmentName}</a>}
            </footer>
            {item.status === "submitted" && (
              <div className={styles.gradeBox}>
                <label><span>{l("학생 피드백", "Student feedback")}</span><textarea
                  rows={3}
                  value={feedback[item.id] || ""}
                  onChange={(event) => setFeedback((current) => ({ ...current, [item.id]: event.target.value }))}
                /></label>
                <button type="button" disabled={busy} onClick={() => grade(item.id)}>{l("피드백 반환", "Return feedback")}</button>
              </div>
            )}
            {item.feedback && <aside><b>{l("반환한 피드백", "Returned feedback")}</b><p>{item.feedback}</p></aside>}
          </article>
        )) : <div className={styles.empty}>{l("아직 등록한 숙제가 없습니다.", "No homework has been assigned yet.")}</div>}
      </section>
    </div>
  );
}

function statusLabel(value: HomeworkStatus, locale: "ko" | "en") {
  if (value === "submitted") return locale === "ko" ? "검토 필요" : "Needs review";
  if (value === "graded") return locale === "ko" ? "피드백 완료" : "Feedback sent";
  return locale === "ko" ? "진행 중" : "In progress";
}

function formatDate(value: string, locale: "ko" | "en") {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { month: "long", day: "numeric" })
    .format(new Date(`${value}T00:00:00`));
}

"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./tutor-homework.module.css";

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
        setMessage(result.error || "숙제를 등록하지 못했습니다.");
        return;
      }
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function grade(id: number) {
    const note = feedback[id]?.trim();
    if (!note) {
      setMessage("학생에게 전달할 피드백을 입력해 주세요.");
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
        setMessage(result.error || "피드백을 저장하지 못했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.workspace}>
      <form className={styles.assignForm} onSubmit={assign}>
        <header><b>새 숙제 등록</b><span>등록 즉시 학생과 연결 보호자에게 표시됩니다.</span></header>
        <label><span>학생</span><select value={studentId} onChange={(event) => setStudentId(event.target.value)} required>
          {students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.email}</option>)}
        </select></label>
        <label><span>과목</span><select name="subject" required defaultValue="">
          <option value="" disabled>과목 선택</option>
          {(selectedStudent?.subjects || []).map((subject) => <option key={subject}>{subject}</option>)}
        </select></label>
        <label className={styles.full}><span>제목</span><input name="title" maxLength={180} required /></label>
        <label className={styles.full}><span>안내</span><textarea name="instructions" rows={5} maxLength={5000} required /></label>
        <label><span>마감일</span><input name="dueDate" type="date" min={new Date().toISOString().slice(0, 10)} required /></label>
        <label><span>첨부 파일</span><input name="attachment" type="file" accept=".pdf,.jpg,.jpeg,.png,.docx" /></label>
        {message && <p className={styles.error} role="alert">{message}</p>}
        <button className={styles.primary} type="submit" disabled={busy || !students.length}>
          {busy ? "저장 중..." : "숙제 등록"}
        </button>
      </form>

      <section className={styles.assignmentList}>
        <header><div><p>ASSIGNMENT LOG</p><h2>등록한 숙제</h2></div><span>{assignments.length}건</span></header>
        {assignments.length ? assignments.map((item) => (
          <article key={item.id}>
            <div className={styles.cardTop}>
              <div><small>{item.studentName} · {item.subject}</small><h3>{item.title}</h3></div>
              <span data-status={item.status}>{statusLabel(item.status)}</span>
            </div>
            <p>{item.instructions}</p>
            <footer>
              <time>마감 {formatDate(item.dueDate)}</time>
              {item.attachmentName && <a href={`/api/homework?file=${item.id}`} target="_blank" rel="noreferrer">{item.attachmentName}</a>}
            </footer>
            {item.status === "submitted" && (
              <div className={styles.gradeBox}>
                <label><span>학생 피드백</span><textarea
                  rows={3}
                  value={feedback[item.id] || ""}
                  onChange={(event) => setFeedback((current) => ({ ...current, [item.id]: event.target.value }))}
                /></label>
                <button type="button" disabled={busy} onClick={() => grade(item.id)}>피드백 반환</button>
              </div>
            )}
            {item.feedback && <aside><b>반환한 피드백</b><p>{item.feedback}</p></aside>}
          </article>
        )) : <div className={styles.empty}>아직 등록한 숙제가 없습니다.</div>}
      </section>
    </div>
  );
}

function statusLabel(value: HomeworkStatus) {
  if (value === "submitted") return "검토 필요";
  if (value === "graded") return "피드백 완료";
  return "진행 중";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" })
    .format(new Date(`${value}T00:00:00`));
}


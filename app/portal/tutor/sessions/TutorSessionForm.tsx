"use client";

import { FormEvent, useState } from "react";
import { usePortalText } from "../../PortalLocale";
import styles from "./sessions.module.css";

export type TutorStudent = { id: string; name: string };

export type ScheduledSession = {
  id: number;
  studentName: string;
  sessionDate: string;
  startsAt: string;
  durationMinutes: number;
  subject: string;
  title: string;
  meetingNumber: string | null;
  status: string | null;
};

export default function TutorSessionForm({
  students,
  sessions,
}: {
  students: TutorStudent[];
  sessions: ScheduledSession[];
}) {
  const { text: l } = usePortalText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setDone(false);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/tutor/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: form.get("studentId"),
        sessionDate: form.get("sessionDate"),
        startsAt: form.get("startsAt"),
        durationMinutes: Number(form.get("durationMinutes")),
        subject: form.get("subject"),
        title: form.get("title"),
        notes: form.get("notes"),
      }),
    }).catch(() => null);

    setBusy(false);
    if (!response || !response.ok) {
      const payload = response ? await response.json().catch(() => null) : null;
      setError(payload?.error || l("수업을 개설하지 못했습니다.", "The lesson could not be created."));
      return;
    }
    setDone(true);
    window.location.reload();
  }

  if (!students.length) {
    return (
      <p className={styles.empty}>
        {l(
          "아직 담당 학생이 없습니다. 학생이 배정되면 이곳에서 Zoom 수업을 개설할 수 있습니다.",
          "No students yet. Once a student is assigned you can create Zoom lessons here.",
        )}
      </p>
    );
  }

  return (
    <>
      <form className={styles.form} onSubmit={submit}>
        <label>
          <span>{l("학생", "Student")}</span>
          <select name="studentId" required defaultValue="">
            <option value="" disabled>
              {l("학생 선택", "Select a student")}
            </option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{l("과목", "Subject")}</span>
          <input name="subject" maxLength={100} required />
        </label>
        <label className={styles.wide}>
          <span>{l("수업 제목", "Lesson title")}</span>
          <input name="title" maxLength={160} required />
        </label>
        <label>
          <span>{l("날짜", "Date")}</span>
          <input name="sessionDate" type="date" required />
        </label>
        <label>
          <span>{l("시작 시각", "Start time")}</span>
          <input name="startsAt" type="time" required />
        </label>
        <label>
          <span>{l("수업 시간 (분)", "Duration (minutes)")}</span>
          <input name="durationMinutes" type="number" min={15} max={240} step={15} defaultValue={60} required />
        </label>
        <label className={styles.wide}>
          <span>{l("메모 (선택)", "Notes (optional)")}</span>
          <textarea name="notes" maxLength={1000} rows={3} />
        </label>
        <div className={styles.actions}>
          <button type="submit" disabled={busy}>
            {busy ? l("개설 중...", "Creating...") : l("Zoom 수업 개설", "Create Zoom lesson")}
          </button>
          {error && <p className={styles.error} role="alert">{error}</p>}
          {done && <p className={styles.ok} role="status">{l("개설되었습니다.", "Created.")}</p>}
        </div>
      </form>

      <section className={styles.list}>
        <h2>{l("최근 수업", "Recent lessons")}</h2>
        {sessions.length === 0 ? (
          <p className={styles.empty}>{l("아직 개설한 수업이 없습니다.", "No lessons created yet.")}</p>
        ) : (
          <ul>
            {sessions.map((session) => (
              <li key={session.id}>
                <div>
                  <b>{session.title}</b>
                  <span>
                    {session.studentName} · {session.subject}
                  </span>
                </div>
                <div>
                  <b>
                    {session.sessionDate} {session.startsAt.slice(0, 5)}
                  </b>
                  <span>
                    {session.durationMinutes}
                    {l("분", " min")}
                    {session.status ? ` · ${session.status}` : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

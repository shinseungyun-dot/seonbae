"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./homework.module.css";
import { usePortalText } from "../PortalLocale";

type HomeworkStatus = "todo" | "submitted" | "graded";

export type HomeworkItem = {
  id: number;
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
  tutorName: string;
};

export default function HomeworkList({
  assignments,
  role,
}: {
  assignments: HomeworkItem[];
  role: "student" | "parent";
}) {
  const router = useRouter();
  const { locale, text: l } = usePortalText();
  const [filter, setFilter] = useState<"all" | HomeworkStatus>("all");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const visible = useMemo(
    () => assignments.filter((item) => filter === "all" || item.status === filter),
    [assignments, filter],
  );

  async function submitHomework(id: number) {
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit", assignmentId: id }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || l("숙제를 제출하지 못했습니다.", "The homework could not be submitted."));
        return;
      }
      router.refresh();
    } catch {
      setMessage(l("네트워크 연결을 확인한 뒤 다시 시도해 주세요.", "Check your connection and try again."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <div className={styles.filters} aria-label={l("숙제 상태 필터", "Homework status filter")}>
        {(["all", "todo", "submitted", "graded"] as const).map((value) => (
          <button
            key={value}
            type="button"
            data-active={filter === value}
            onClick={() => setFilter(value)}
          >
            {filterLabel(value, locale)}
            <span>{value === "all" ? assignments.length : assignments.filter((item) => item.status === value).length}</span>
          </button>
        ))}
      </div>
      {message && <p className={styles.error} role="alert">{message}</p>}
      <div className={styles.list}>
        {visible.length ? visible.map((item) => (
          <article className={styles.assignment} key={item.id}>
            <header>
              <div>
                <span className={styles.subject}>{item.subject}</span>
                <h2>{item.title}</h2>
                <p>{role === "parent" && `${item.studentName} · `}{item.tutorName}{l(" 튜터", ", tutor")}</p>
              </div>
              <span className={styles[item.status]}>{statusLabel(item.status, locale)}</span>
            </header>
            <p className={styles.instructions}>{item.instructions}</p>
            <footer>
              <time dateTime={item.dueDate}>{l("마감", "Due")} {formatDate(item.dueDate, locale)}</time>
              {item.attachmentName && (
                <a href={`/api/homework?file=${item.id}`} target="_blank" rel="noreferrer">
                  {l("첨부", "Attachment")} · {item.attachmentName}
                </a>
              )}
              {role === "student" && item.status === "todo" && (
                <button type="button" disabled={busyId === item.id} onClick={() => submitHomework(item.id)}>
                  {busyId === item.id ? l("제출 중...", "Submitting...") : l("완료로 제출", "Submit as complete")}
                </button>
              )}
            </footer>
            {item.status === "submitted" && (
              <aside className={styles.waiting}>{l("튜터가 제출 내용을 확인하고 있습니다.", "Your tutor is reviewing the submission.")}</aside>
            )}
            {item.feedback && (
              <aside className={styles.feedback}>
                <b>{l("튜터 피드백", "Tutor feedback")}</b>
                <p>{item.feedback}</p>
              </aside>
            )}
          </article>
        )) : (
          <div className={styles.empty}>
            <b>{l("이 상태의 숙제가 없습니다.", "No homework has this status.")}</b>
            <span>{l("새 숙제가 등록되면 이곳에 표시됩니다.", "New homework will appear here.")}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function filterLabel(value: "all" | HomeworkStatus, locale: "ko" | "en") {
  return value === "all" ? (locale === "ko" ? "전체" : "All") : statusLabel(value, locale);
}

function statusLabel(value: HomeworkStatus, locale: "ko" | "en") {
  if (value === "submitted") return locale === "ko" ? "검토 중" : "In review";
  if (value === "graded") return locale === "ko" ? "피드백 완료" : "Feedback received";
  return locale === "ko" ? "할 일" : "To do";
}

function formatDate(value: string, locale: "ko" | "en") {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { month: "long", day: "numeric", weekday: "short" })
    .format(new Date(`${value}T00:00:00`));
}

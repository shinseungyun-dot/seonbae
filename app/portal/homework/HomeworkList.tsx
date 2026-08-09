"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./homework.module.css";

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
        setMessage(result.error || "숙제를 제출하지 못했습니다.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section>
      <div className={styles.filters} aria-label="숙제 상태 필터">
        {(["all", "todo", "submitted", "graded"] as const).map((value) => (
          <button
            key={value}
            type="button"
            data-active={filter === value}
            onClick={() => setFilter(value)}
          >
            {filterLabel(value)}
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
                <p>{role === "parent" && `${item.studentName} · `}{item.tutorName} 튜터</p>
              </div>
              <span className={styles[item.status]}>{statusLabel(item.status)}</span>
            </header>
            <p className={styles.instructions}>{item.instructions}</p>
            <footer>
              <time dateTime={item.dueDate}>마감 {formatDate(item.dueDate)}</time>
              {item.attachmentName && (
                <a href={`/api/homework?file=${item.id}`} target="_blank" rel="noreferrer">
                  첨부 · {item.attachmentName}
                </a>
              )}
              {role === "student" && item.status === "todo" && (
                <button type="button" disabled={busyId === item.id} onClick={() => submitHomework(item.id)}>
                  {busyId === item.id ? "제출 중..." : "완료로 제출"}
                </button>
              )}
            </footer>
            {item.status === "submitted" && (
              <aside className={styles.waiting}>튜터가 제출 내용을 확인하고 있습니다.</aside>
            )}
            {item.feedback && (
              <aside className={styles.feedback}>
                <b>튜터 피드백</b>
                <p>{item.feedback}</p>
              </aside>
            )}
          </article>
        )) : (
          <div className={styles.empty}>
            <b>이 상태의 숙제가 없습니다.</b>
            <span>새 숙제가 등록되면 이곳에 표시됩니다.</span>
          </div>
        )}
      </div>
    </section>
  );
}

function filterLabel(value: "all" | HomeworkStatus) {
  return value === "all" ? "전체" : statusLabel(value);
}

function statusLabel(value: HomeworkStatus) {
  if (value === "submitted") return "검토 중";
  if (value === "graded") return "피드백 완료";
  return "할 일";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" })
    .format(new Date(`${value}T00:00:00`));
}


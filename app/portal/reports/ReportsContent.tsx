"use client";

import { usePortalText } from "../PortalLocale";
import styles from "../parent.module.css";

export type PortalReport = {
  id: number;
  date: string;
  title: string;
  studentName: string;
  subject: string;
  tutorName: string;
  minutes: number;
  notes: string | null;
};

export default function ReportsContent({ reports, studentCount }: { reports: PortalReport[]; studentCount: number }) {
  const { locale, text: l } = usePortalText();
  return (
    <div className={styles.shell}>
      <header className={styles.pageHeading}>
        <p>LESSON REPORTS</p>
        <h1>{l("수업 리포트", "Lesson reports")}</h1>
        <span>{l("완료된 수업별 학습 내용과 튜터 전달 사항을 확인합니다.", "Review learning notes and tutor updates for each completed lesson.")}</span>
      </header>
      <section className={styles.reportLayout}>
        <aside className={styles.reportSummary}>
          <span>{l("누적 완료", "Completed")}</span>
          <strong>{reports.length}</strong>
          <p>{l(`연결된 학생 ${studentCount}명의 수업 기록`, `Lesson history for ${studentCount} linked student${studentCount === 1 ? "" : "s"}`)}</p>
        </aside>
        <div className={styles.reportList}>
          {reports.length ? reports.map((report) => (
            <article className={styles.reportCard} key={report.id}>
              <header><div><time>{formatDate(report.date, locale)}</time><h2>{report.title}</h2></div><span>{report.studentName}</span></header>
              <dl>
                <div><dt>{l("과목", "Subject")}</dt><dd>{report.subject}</dd></div>
                <div><dt>{l("튜터", "Tutor")}</dt><dd>{report.tutorName}</dd></div>
                <div><dt>{l("진행 시간", "Duration")}</dt><dd>{formatMinutes(report.minutes, locale)}</dd></div>
              </dl>
              <div className={styles.reportBody}><strong>{l("수업 전달 사항", "Lesson notes")}</strong><p>{report.notes || l("튜터가 수업 리포트를 작성 중입니다.", "The tutor is preparing this lesson report.")}</p></div>
            </article>
          )) : (
            <div className={`${styles.panel} ${styles.emptyState}`}>
              <strong>{l("아직 완료된 수업 리포트가 없습니다.", "There are no completed lesson reports yet.")}</strong>
              <p>{l("수업이 완료되면 튜터 전달 사항과 진행 시간이 이곳에 쌓입니다.", "Tutor notes and lesson duration will appear here after each lesson ends.")}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string, locale: "ko" | "en") {
  return new Intl.DateTimeFormat(locale === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "long", day: "numeric", weekday: "short" }).format(new Date(`${value}T00:00:00`));
}

function formatMinutes(value: number, locale: "ko" | "en") {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (locale === "en") return hours ? `${hours}h${minutes ? ` ${minutes}m` : ""}` : `${minutes}m`;
  if (!hours) return `${minutes}분`;
  return minutes ? `${hours}시간 ${minutes}분` : `${hours}시간`;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { createClient } from "../../../utils/supabase/client";
import ChatPanel, { type PortalChatThread } from "../ChatPanel";
import styles from "../portal.module.css";

export type TutorPortalSession = {
  id: number;
  studentName: string;
  sessionDate: string;
  startsAt: string;
  durationMinutes: number;
  actualMinutes: number | null;
  subject: string;
  title: string;
  sessionType: string;
  location: string | null;
  notes: string | null;
  zoomMeetingNumber: string | null;
  zoomStatus: string;
};

export default function TutorPortalDashboard({
  currentUserId,
  tutor,
  sessions,
  chatThreads,
}: {
  currentUserId: string;
  tutor: { name: string; email: string; registryId: string };
  sessions: TutorPortalSession[];
  chatThreads: PortalChatThread[];
}) {
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDetailsElement>(null);

  function setProfileMenuOpen(open: boolean) {
    if (profileMenuRef.current) profileMenuRef.current.open = open;
  }
  const completed = sessions.filter(
    (session) => session.zoomStatus === "ended",
  );
  const completedMinutes = completed.reduce(
    (sum, session) =>
      sum + (session.actualMinutes ?? session.durationMinutes),
    0,
  );
  const activeStudents = new Set(
    sessions
      .filter((session) => session.zoomStatus !== "cancelled")
      .map((session) => session.studentName),
  ).size;
  const upcoming = sessions.filter(
    (session) =>
      session.zoomStatus !== "cancelled"
      && session.zoomStatus !== "ended"
      && new Date(`${session.sessionDate}T${session.startsAt}`).getTime()
        >= Date.now() - 30 * 60 * 1000,
  );

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/#/ko/home">
          <img src="/seonbae-logo-antique.png" alt="" />
          <span>
            <b>선배</b>
            <small>TUTOR PORTAL</small>
          </span>
        </Link>
        <div className={styles.account}>
          <details
            ref={profileMenuRef}
            className={styles.profileMenu}
            onMouseEnter={() => setProfileMenuOpen(true)}
            onMouseLeave={() => setProfileMenuOpen(false)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setProfileMenuOpen(false);
              }
            }}
          >
            <summary
              onClick={(event) => {
                if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                  event.preventDefault();
                }
              }}
            >
              <span className={styles.avatar}>{initials(tutor.name)}</span>
              <span className={styles.accountMeta}>
                <small>{tutor.registryId}</small>
                <b>{tutor.name}</b>
              </span>
              <span className={styles.profileChevron}>▾</span>
            </summary>
            <div>
              <Link href="/my-page#info">내 정보</Link>
              <Link href="/my-page#policies">정책</Link>
              <Link href="/my-page#settings">설정</Link>
              <button type="button" onClick={signOut}>
                로그아웃
              </button>
            </div>
          </details>
          <button type="button" onClick={signOut}>
            로그아웃
          </button>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles.hero}>
          <div>
            <p>SEONBAE TUTOR · {tutor.email}</p>
            <h1>
              {tutor.name}님의
              <br />
              튜터 포털
            </h1>
            <span>
              수업을 개설하고 학생과 대화할 수 있는 튜터 전용 공간입니다.
            </span>
          </div>
          <div className={styles.stats}>
            <article>
              <b>{completed.length}</b>
              <span>완료한 수업</span>
            </article>
            <article>
              <b>{formatMinutes(completedMinutes)}</b>
              <span>누적 수업 시간</span>
            </article>
            <article>
              <b>{activeStudents}</b>
              <span>담당 학생</span>
            </article>
          </div>
        </div>

        <div className={styles.sync}>
          <span className={styles.syncDot} />
          <p>
            <b>튜터 호스트 권한</b> · 학생은 회의를 개설할 수 없으며, 담당
            튜터만 수업 Zoom을 호스트합니다.
          </p>
        </div>

        <section className={`${styles.panel} ${styles.tutorSchedulePanel}`}>
          <div className={styles.panelHeading}>
            <div>
              <p>LESSON SCHEDULE</p>
              <h2>예정된 수업</h2>
            </div>
            <span className={styles.chatLive}>
              {upcoming.length}개의 예정 수업
            </span>
          </div>
          <div className={styles.tutorSchedule}>
            {upcoming.length ? (
              upcoming.map((session) => (
                <article key={session.id}>
                  <time>
                    <b>{formatDate(session.sessionDate)}</b>
                    <span>{session.startsAt.slice(0, 5)}</span>
                  </time>
                  <div>
                    <h3>{session.title}</h3>
                    <p>
                      {session.studentName} · {session.subject} ·{" "}
                      {session.durationMinutes}분
                    </p>
                  </div>
                  {session.zoomMeetingNumber ? (
                    <Link href={`/portal/meeting/${session.id}`}>
                      수업 호스트 시작 →
                    </Link>
                  ) : (
                    <span>Zoom 준비 중</span>
                  )}
                </article>
              ))
            ) : (
              <div className={styles.chatEmpty}>예정된 수업이 없습니다.</div>
            )}
          </div>
        </section>

        <section className={`${styles.panel} ${styles.tutorHistoryPanel}`}>
          <div className={styles.panelHeading}>
            <div>
              <p>COMPLETED LESSONS</p>
              <h2>완료 기록</h2>
            </div>
          </div>
          <div className={styles.tutorHistory}>
            {completed.length ? (
              completed
                .slice()
                .reverse()
                .map((session) => (
                  <article key={session.id}>
                    <span>{formatDate(session.sessionDate)}</span>
                    <b>{session.studentName}</b>
                    <p>{session.title}</p>
                    <strong>
                      {session.actualMinutes ?? session.durationMinutes}분
                    </strong>
                  </article>
                ))
            ) : (
              <div className={styles.chatEmpty}>
                Zoom 수업이 종료되면 실제 진행 시간이 기록됩니다.
              </div>
            )}
          </div>
        </section>

        <ChatPanel
          currentUserId={currentUserId}
          threads={chatThreads}
          heading="학생 채팅"
        />
      </section>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMinutes(value: number) {
  if (!value) return "0h";
  const hours = value / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function initials(value: string) {
  const clean = value.trim();
  if (/^[가-힣]/.test(clean)) return clean.slice(-2);
  return clean
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

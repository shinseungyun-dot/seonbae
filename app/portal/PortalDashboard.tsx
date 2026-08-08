"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ChatPanel, { type PortalChatThread } from "./ChatPanel";
import PortalHeader, { type PortalHeaderUser } from "./PortalHeader";
import styles from "./portal.module.css";

export type PortalSession = {
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
  tutorRegistryId: string | null;
  zoomMeetingNumber: string | null;
  zoomStatus: string;
  tutor: {
    name: string;
    university: string | null;
    photoUrl: string | null;
  } | null;
};

export type PortalConsultation = {
  id: number;
  sessionDate: string;
  startsAt: string;
  durationMinutes: number;
  actualMinutes: number | null;
  topic: string;
  title: string;
  notes: string | null;
  zoomMeetingNumber: string | null;
  zoomStatus: string;
};

type PortalUser = PortalHeaderUser;

export default function PortalDashboard({
  currentUserId,
  user,
  sessions,
  consultations,
  chatThreads,
  linkedStudentCount,
}: {
  currentUserId: string;
  user: PortalUser;
  sessions: PortalSession[];
  consultations: PortalConsultation[];
  chatThreads: PortalChatThread[];
  linkedStudentCount: number;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => initialVisibleMonth());
  const [selectedDate, setSelectedDate] = useState(() => initialDateKey());

  const calendarDays = useMemo(
    () => getCalendarDays(visibleMonth),
    [visibleMonth],
  );
  const selectedSessions = sessions.filter(
    (session) => session.sessionDate === selectedDate,
  );
  const selected = selectedSessions[0] ?? null;
  const nextSession =
    sessions.find(
      (session) =>
        session.zoomStatus !== "cancelled"
        && session.zoomStatus !== "ended"
        && sessionDateTime(session).getTime() >= Date.now(),
    ) ?? null;
  const completed = sessions.filter(
    (session) => session.zoomStatus === "ended",
  );
  const completedMinutes = completed.reduce(
    (sum, session) =>
      sum + (session.actualMinutes ?? session.durationMinutes),
    0,
  );
  const completedConsultations = consultations.filter(
    (session) => session.zoomStatus === "ended",
  ).length;

  function moveMonth(direction: number) {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + direction,
      1,
    );
    if (nextMonth < MINIMUM_PORTAL_MONTH) return;
    setVisibleMonth(nextMonth);
    setSelectedDate(localDateKey(nextMonth));
  }

  function selectCalendarDate(date: Date) {
    if (date < MINIMUM_PORTAL_MONTH) return;
    setSelectedDate(localDateKey(date));
    if (!sameMonth(date, visibleMonth)) setVisibleMonth(startOfMonth(date));
  }

  return (
    <main className={styles.page}>
      <PortalHeader user={user} />

      <section className={styles.content}>
        <div className={styles.hero}>
          <div>
            <p>
              {user.role === "parent" ? "SEONBAE FAMILY" : "SEONBAE STUDENT"} ·{" "}
              {user.email}
            </p>
            <h1>
              {user.name}님의
              <br />
              {user.role === "parent" ? "보호자 포털" : "학습 포털"}
            </h1>
            <span>
              {user.role === "parent"
                ? "자녀의 수업 현황과 창업팀 상담 일정을 한곳에서 확인하세요."
                : "수업 일정, 누적 학습 기록, 담당 튜터와의 대화를 확인하세요."}
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
              <b>
                {user.role === "parent"
                  ? linkedStudentCount
                  : new Set(
                      sessions
                        .map((session) => session.tutorRegistryId)
                        .filter(Boolean),
                    ).size}
              </b>
              <span>
                {user.role === "parent" ? "연결된 학생" : "담당 튜터"}
              </span>
            </article>
          </div>
        </div>

        <div className={styles.sync}>
          <span className={styles.syncDot} />
          <p>
            <b>실시간 일정</b> · Zoom 회의가 끝나면 실제 진행 시간과 완료
            수업 수가 자동으로 반영됩니다.
          </p>
          <time>
            {new Intl.DateTimeFormat("ko-KR", {
              month: "long",
              day: "numeric",
            }).format(new Date())}{" "}
            기준
          </time>
        </div>

        {user.role === "parent" && (
          <section className={styles.parentActions} aria-label="보호자 주요 메뉴">
            <div>
              <strong>
                {linkedStudentCount > 0
                  ? `${linkedStudentCount}명의 학생 계정이 연결되어 있습니다.`
                  : "학생 계정을 먼저 연결해 주세요."}
              </strong>
              <span>
                OTP 확인 후 학생 일정, 수업 리포트, 결제 내역을 함께 관리할 수 있습니다.
              </span>
            </div>
            <nav>
              <Link href="/portal/family">학생 연결</Link>
              <Link href="/portal/reports">수업 리포트</Link>
              <Link href="/portal/billing">결제 내역</Link>
            </nav>
          </section>
        )}

        <div className={styles.dashboard}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <div>
                <p>YOUR CALENDAR</p>
                <h2>월간 수업 일정</h2>
              </div>
              <div className={styles.monthNav}>
                <button
                  type="button"
                  onClick={() => moveMonth(-1)}
                  aria-label="이전 달"
                  disabled={sameMonth(visibleMonth, MINIMUM_PORTAL_MONTH)}
                >
                  ←
                </button>
                <span>{formatMonth(visibleMonth)}</span>
                <button
                  type="button"
                  onClick={() => moveMonth(1)}
                  aria-label="다음 달"
                >
                  →
                </button>
              </div>
            </div>

            <div className={styles.calendarWeekdays} aria-hidden="true">
              {["일", "월", "화", "수", "목", "금", "토"].map((weekday) => (
                <span key={weekday}>{weekday}</span>
              ))}
            </div>
            <div className={styles.calendarGrid}>
              {calendarDays.map((date) => {
                const key = localDateKey(date);
                const count = sessions.filter(
                  (session) => session.sessionDate === key,
                ).length;
                const beforeMinimum = date < MINIMUM_PORTAL_MONTH;
                const className = [
                  !sameMonth(date, visibleMonth) ? styles.outsideMonth : "",
                  selectedDate === key ? styles.selectedDay : "",
                  key === localDateKey(new Date()) ? styles.today : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <button
                    type="button"
                    className={className}
                    onClick={() => selectCalendarDate(date)}
                    key={key}
                    disabled={beforeMinimum}
                    aria-pressed={selectedDate === key}
                    aria-label={`${formatDate(key)}, 수업 ${count}개`}
                  >
                    <span className={styles.calendarNumber}>
                      {date.getDate()}
                    </span>
                    {count > 0 && <em>{count}개</em>}
                  </button>
                );
              })}
            </div>

            <div className={styles.lessons}>
              {selectedSessions.length ? (
                selectedSessions.map((session) => (
                  <article className={styles.lesson} key={session.id}>
                    <span className={styles.lessonBar} />
                    <time>
                      <b>{session.startsAt.slice(0, 5)}</b>
                      <small>{session.durationMinutes}분</small>
                    </time>
                    <div>
                      <h3>{session.title}</h3>
                      <p>
                        {user.role === "parent"
                          ? `${session.studentName} · `
                          : ""}
                        {session.tutor?.name || "담당 튜터 배정 중"} ·{" "}
                        {session.sessionType}
                      </p>
                    </div>
                    <span className={styles.subject}>{session.subject}</span>
                    {zoomIsAvailable(session) && (
                      <Link
                        className={styles.zoomLink}
                        href={`/portal/meeting/${session.id}`}
                      >
                        Zoom 입장 →
                      </Link>
                    )}
                  </article>
                ))
              ) : (
                <div className={styles.empty}>
                  <span>수업이 없는 날입니다.</span>
                  <p>다른 날짜를 선택하면 예정된 수업을 확인할 수 있습니다.</p>
                </div>
              )}
            </div>
          </section>

          <aside className={styles.side}>
            <section className={styles.panel}>
              <div className={styles.sideHeading}>
                <p>UP NEXT</p>
                <h2>다음 수업</h2>
              </div>
              {nextSession ? (
                <div className={styles.next}>
                  <span>
                    {formatDate(nextSession.sessionDate)} ·{" "}
                    {nextSession.startsAt.slice(0, 5)}
                  </span>
                  <h3>{nextSession.title}</h3>
                  <p>
                    {nextSession.subject} · {nextSession.durationMinutes}분
                  </p>
                  <b>
                    {user.role === "parent"
                      ? `${nextSession.studentName} · `
                      : ""}
                    {nextSession.sessionType}
                  </b>
                  {zoomIsAvailable(nextSession) && (
                    <Link
                      className={styles.nextZoomLink}
                      href={`/portal/meeting/${nextSession.id}`}
                    >
                      Zoom 교실 입장 <span>→</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className={styles.sideEmpty}>
                  예정된 다음 수업이 없습니다.
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.sideHeading}>
                <p>LESSON DETAILS</p>
                <h2>선택한 수업</h2>
              </div>
              {selected ? (
                <div className={styles.tutorDetail}>
                  {selected.tutor?.photoUrl ? (
                    <img
                      src={selected.tutor.photoUrl}
                      alt={`${selected.tutor.name} 튜터`}
                    />
                  ) : (
                    <span className={styles.tutorPhoto}>
                      {initials(selected.tutor?.name || "선배")}
                    </span>
                  )}
                  <div>
                    <b>{selected.tutor?.name || "담당 튜터 배정 중"}</b>
                    <small>
                      {selected.tutor?.university
                        || selected.tutorRegistryId
                        || "선배 튜터"}
                    </small>
                  </div>
                  <p>
                    {selected.notes
                      || "수업 전 전달 사항이 등록되면 이곳에 표시됩니다."}
                  </p>
                </div>
              ) : (
                <div className={styles.sideEmpty}>
                  수업을 선택하면 담당 튜터와 전달 사항을 확인할 수 있습니다.
                </div>
              )}
            </section>
          </aside>
        </div>

        {user.role === "parent" ? (
          <ParentConsultations
            consultations={consultations}
            completedCount={completedConsultations}
          />
        ) : (
          <ChatPanel
            currentUserId={currentUserId}
            threads={chatThreads}
            heading="담당 튜터와 채팅"
          />
        )}
      </section>
    </main>
  );
}

function ParentConsultations({
  consultations,
  completedCount,
}: {
  consultations: PortalConsultation[];
  completedCount: number;
}) {
  return (
    <section className={`${styles.panel} ${styles.chatPanel}`}>
      <div className={styles.panelHeading}>
        <div>
          <p>FAMILY CONSULTATION</p>
          <h2>창업팀 상담</h2>
        </div>
        <span className={styles.chatLive}>
          완료 {completedCount}회 · 수업 상담과 별도 운영
        </span>
      </div>
      <p className={styles.consultationIntro}>
        학습 방향, 튜터 매칭, 서비스 이용에 관한 보호자 상담입니다. 튜터–학생
        수업과 분리된 전용 Zoom 회의로 진행됩니다.
      </p>
      <div className={styles.consultations}>
        {consultations.length ? (
          consultations.map((consultation) => (
            <article className={styles.consultationCard} key={consultation.id}>
              <time>
                <b>{formatDate(consultation.sessionDate)}</b>
                <span>{consultation.startsAt.slice(0, 5)}</span>
              </time>
              <div>
                <h3>{consultation.title}</h3>
                <p>
                  {consultation.topic} · {consultation.durationMinutes}분
                  {consultation.zoomStatus === "ended"
                    ? ` · 실제 ${consultation.actualMinutes ?? consultation.durationMinutes}분`
                    : ""}
                </p>
              </div>
              {consultationZoomIsAvailable(consultation) && (
                <Link href={`/portal/consultation/${consultation.id}`}>
                  상담 입장 →
                </Link>
              )}
            </article>
          ))
        ) : (
          <div className={styles.chatEmpty}>
            예정된 창업팀 상담이 없습니다. 상담 신청 후 일정이 확정되면 이곳에
            표시됩니다.
          </div>
        )}
      </div>
    </section>
  );
}

const MINIMUM_PORTAL_MONTH = new Date(2026, 0, 1);

function initialVisibleMonth() {
  const now = new Date();
  return now < MINIMUM_PORTAL_MONTH
    ? MINIMUM_PORTAL_MONTH
    : startOfMonth(now);
}

function initialDateKey() {
  const now = new Date();
  return localDateKey(now < MINIMUM_PORTAL_MONTH ? MINIMUM_PORTAL_MONTH : now);
}

function getCalendarDays(month: Date) {
  const firstVisibleDate = new Date(month.getFullYear(), month.getMonth(), 1);
  firstVisibleDate.setDate(
    firstVisibleDate.getDate() - firstVisibleDate.getDay(),
  );
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDate);
    date.setDate(firstVisibleDate.getDate() + index);
    return date;
  });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function sameMonth(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
  );
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sessionDateTime(session: PortalSession) {
  return new Date(`${session.sessionDate}T${session.startsAt}`);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMonth(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(value);
}

function formatMinutes(value: number) {
  if (!value) return "0h";
  const hours = value / 60;
  return Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

function initials(value: string) {
  const clean = value.trim();
  if (!clean) return "선";
  if (/^[가-힣]/.test(clean)) return clean.slice(-2);
  return clean
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function zoomIsAvailable(session: PortalSession) {
  return (
    Boolean(session.zoomMeetingNumber)
    && session.zoomStatus !== "cancelled"
    && session.zoomStatus !== "ended"
  );
}

function consultationZoomIsAvailable(session: PortalConsultation) {
  return (
    Boolean(session.zoomMeetingNumber)
    && session.zoomStatus !== "cancelled"
    && session.zoomStatus !== "ended"
  );
}

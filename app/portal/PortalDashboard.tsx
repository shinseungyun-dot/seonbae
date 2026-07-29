"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import styles from "./portal.module.css";

export type PortalSession = {
  id: number;
  sessionDate: string;
  startsAt: string;
  durationMinutes: number;
  subject: string;
  title: string;
  sessionType: string;
  location: string | null;
  notes: string | null;
  tutorRegistryId: string | null;
  zoomMeetingNumber: string | null;
  zoomStatus: string;
  tutor: { name: string; university: string | null; photoUrl: string | null } | null;
};

type PortalUser = {
  name: string;
  email: string;
  role: "user" | "tutor" | "admin";
};

export default function PortalDashboard({ user, sessions }: { user: PortalUser; sessions: PortalSession[] }) {
  const router = useRouter();
  const [visibleMonth, setVisibleMonth] = useState(() => initialVisibleMonth());
  const [selectedDate, setSelectedDate] = useState(() => initialDateKey());

  const calendarDays = useMemo(() => getCalendarDays(visibleMonth), [visibleMonth]);
  const monthPrefix = `${visibleMonth.getFullYear()}-${String(visibleMonth.getMonth() + 1).padStart(2, "0")}`;
  const monthSessions = sessions.filter((session) => session.sessionDate.startsWith(monthPrefix));
  const selectedSessions = sessions.filter((session) => session.sessionDate === selectedDate);
  const selected = selectedSessions[0] ?? null;
  const nextSession = sessions.find((session) => sessionDateTime(session).getTime() >= Date.now()) ?? null;
  const totalHours = monthSessions.reduce((sum, session) => sum + session.durationMinutes, 0) / 60;
  const tutorCount = new Set(monthSessions.map((session) => session.tutorRegistryId).filter(Boolean)).size;

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
    if (!sameMonth(date, visibleMonth)) {
      setVisibleMonth(startOfMonth(date));
    }
  }

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
          <span><b>선배</b><small>LEARNING PORTAL</small></span>
        </Link>
        <div className={styles.account}>
          <details className={styles.profileMenu}>
            <summary>
              <span className={styles.avatar}>{initials(user.name)}</span>
              <span className={styles.accountMeta}><small>로그인 계정</small><b>{user.name}</b></span>
              <span className={styles.profileChevron} aria-hidden="true">⌄</span>
            </summary>
            <div>
              <Link href="/my-page#info">내 정보</Link>
              <Link href="/my-page#policies">정책</Link>
              <Link href="/my-page#settings">설정</Link>
              <button type="button" onClick={signOut}>로그아웃</button>
            </div>
          </details>
          {user.role === "admin" && <Link className={styles.adminLink} href="/admin">명부 관리</Link>}
          <button type="button" onClick={signOut}>로그아웃</button>
        </div>
      </header>

      <section className={styles.content}>
        <div className={styles.hero}>
          <div>
            <p>SEONBAE MEMBER · {user.email}</p>
            <h1>{user.name}님의<br />{user.role === "tutor" ? "튜터 포털" : "학습 포털"}</h1>
            <span>
              {user.role === "tutor"
                ? "담당 수업 일정과 Zoom 교실을 한곳에서 확인하세요."
                : "수업 일정과 담당 튜터 정보를 한곳에서 확인하세요."}
            </span>
          </div>
          <div className={styles.stats}>
            <article><b>{monthSessions.length}</b><span>이번 달 수업</span></article>
            <article><b>{tutorCount}</b><span>담당 튜터</span></article>
            <article><b>{formatHours(totalHours)}</b><span>예정 시간</span></article>
          </div>
        </div>

        <div className={styles.sync}>
          <span className={styles.syncDot} />
          <p><b>실시간 일정</b> · 수업 일정과 Zoom 상태가 실시간으로 반영됩니다.</p>
          <time>{new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date())} 기준</time>
        </div>

        <div className={styles.dashboard}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><p>YOUR CALENDAR</p><h2>월간 수업 일정</h2></div>
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
                <button type="button" onClick={() => moveMonth(1)} aria-label="다음 달">→</button>
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
                const count = sessions.filter((session) => session.sessionDate === key).length;
                const beforeMinimum = date < MINIMUM_PORTAL_MONTH;
                const className = [
                  !sameMonth(date, visibleMonth) ? styles.outsideMonth : "",
                  selectedDate === key ? styles.selectedDay : "",
                  key === localDateKey(new Date()) ? styles.today : "",
                ].filter(Boolean).join(" ");
                return (
                  <button
                    type="button"
                    className={className}
                    onClick={() => selectCalendarDate(date)}
                    key={key}
                    disabled={beforeMinimum}
                    aria-pressed={selectedDate === key}
                    aria-label={`${formatDate(key)}${count ? `, 수업 ${count}개` : ", 수업 없음"}`}
                  >
                    <span className={styles.calendarNumber}>{date.getDate()}</span>
                    {count > 0 && <em>{count}회</em>}
                  </button>
                );
              })}
            </div>

            <div className={styles.lessons}>
              {selectedSessions.length > 0 ? selectedSessions.map((session) => (
                <article className={styles.lesson} key={session.id}>
                  <span className={styles.lessonBar} />
                  <time><b>{session.startsAt.slice(0, 5)}</b><small>{session.durationMinutes}분</small></time>
                  <div><h3>{session.title}</h3><p>{session.tutor?.name || "담당 튜터 배정 중"} · {session.sessionType}</p></div>
                  <span className={styles.subject}>{session.subject}</span>
                  {zoomIsAvailable(session) && (
                    <Link
                      className={styles.zoomLink}
                      href={`/portal/meeting/${session.id}`}
                    >
                      Zoom 입장 ↗
                    </Link>
                  )}
                </article>
              )) : (
                <div className={styles.empty}><span>수업이 없는 날입니다.</span><p>다른 날짜를 선택하면 예정된 수업을 확인할 수 있습니다.</p></div>
              )}
            </div>
          </section>

          <aside className={styles.side}>
            <section className={styles.panel}>
              <div className={styles.sideHeading}><p>UP NEXT</p><h2>다음 수업</h2></div>
              {nextSession ? (
                <div className={styles.next}>
                  <span>{formatDate(nextSession.sessionDate)} · {nextSession.startsAt.slice(0, 5)}</span>
                  <h3>{nextSession.title}</h3>
                  <p>{nextSession.subject} · {nextSession.durationMinutes}분</p>
                  <b>{nextSession.sessionType}{nextSession.location ? ` · ${nextSession.location}` : ""}</b>
                  {zoomIsAvailable(nextSession) && (
                    <Link
                      className={styles.nextZoomLink}
                      href={`/portal/meeting/${nextSession.id}`}
                    >
                      Zoom 교실 열기 <span>↗</span>
                    </Link>
                  )}
                </div>
              ) : (
                <div className={styles.sideEmpty}>예정된 다음 수업이 없습니다.</div>
              )}
            </section>

            <section className={styles.panel}>
              <div className={styles.sideHeading}><p>LESSON DETAILS</p><h2>선택한 수업</h2></div>
              {selected ? (
                <div className={styles.tutorDetail}>
                  {selected.tutor?.photoUrl
                    ? <img src={selected.tutor.photoUrl} alt={`${selected.tutor.name} 튜터`} />
                    : <span className={styles.tutorPhoto}>{initials(selected.tutor?.name || "선배")}</span>}
                  <div><b>{selected.tutor?.name || "담당 튜터 배정 중"}</b><small>{selected.tutor?.university || selected.tutorRegistryId || "선배 튜터"}</small></div>
                  <p>{selected.notes || "수업 전 전달 사항이 등록되면 이곳에 표시됩니다."}</p>
                  {zoomIsAvailable(selected) && (
                    <Link
                      className={styles.detailZoomLink}
                      href={`/portal/meeting/${selected.id}`}
                    >
                      포털에서 Zoom 수업 입장
                    </Link>
                  )}
                </div>
              ) : (
                <div className={styles.sideEmpty}>수업을 선택하면 담당 튜터와 전달 사항을 확인할 수 있습니다.</div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

const MINIMUM_PORTAL_MONTH = new Date(2026, 0, 1);

function initialVisibleMonth() {
  const now = new Date();
  return now < MINIMUM_PORTAL_MONTH ? MINIMUM_PORTAL_MONTH : startOfMonth(now);
}

function initialDateKey() {
  const now = new Date();
  return localDateKey(now < MINIMUM_PORTAL_MONTH ? MINIMUM_PORTAL_MONTH : now);
}

function getCalendarDays(month: Date) {
  const firstVisibleDate = new Date(month.getFullYear(), month.getMonth(), 1);
  firstVisibleDate.setDate(firstVisibleDate.getDate() - firstVisibleDate.getDay());

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
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
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
  return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${value}T00:00:00`));
}

function formatMonth(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long" }).format(value);
}

function formatHours(value: number) {
  return Number.isInteger(value) ? `${value}h` : `${value.toFixed(1)}h`;
}

function initials(value: string) {
  const clean = value.trim();
  if (!clean) return "선";
  if (/^[가-힣]/.test(clean)) return clean.slice(-2);
  return clean.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}

function zoomIsAvailable(session: PortalSession) {
  return (
    Boolean(session.zoomMeetingNumber)
    && session.zoomStatus !== "cancelled"
    && session.zoomStatus !== "ended"
  );
}

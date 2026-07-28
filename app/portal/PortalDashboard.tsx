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
  tutor: { name: string; university: string | null; photoUrl: string | null } | null;
};

type PortalUser = {
  name: string;
  email: string;
  role: "user" | "admin";
};

export default function PortalDashboard({ user, sessions }: { user: PortalUser; sessions: PortalSession[] }) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => todayKey());

  const week = useMemo(() => getWeek(weekOffset), [weekOffset]);
  const weekSessions = sessions.filter((session) => week.some((day) => day.key === session.sessionDate));
  const selectedSessions = weekSessions.filter((session) => session.sessionDate === selectedDate);
  const selected = selectedSessions[0] ?? null;
  const nextSession = sessions.find((session) => sessionDateTime(session).getTime() >= Date.now()) ?? null;
  const totalHours = weekSessions.reduce((sum, session) => sum + session.durationMinutes, 0) / 60;
  const tutorCount = new Set(weekSessions.map((session) => session.tutorRegistryId).filter(Boolean)).size;

  function moveWeek(direction: number) {
    const nextOffset = weekOffset + direction;
    const nextWeek = getWeek(nextOffset);
    setWeekOffset(nextOffset);
    setSelectedDate(nextWeek[0].key);
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
            <h1>{user.name}님의<br />학습 포털</h1>
            <span>수업 일정과 담당 튜터 정보를 한곳에서 확인하세요.</span>
          </div>
          <div className={styles.stats}>
            <article><b>{weekSessions.length}</b><span>이번 주 수업</span></article>
            <article><b>{tutorCount}</b><span>담당 튜터</span></article>
            <article><b>{formatHours(totalHours)}</b><span>예정 시간</span></article>
          </div>
        </div>

        <div className={styles.sync}>
          <span className={styles.syncDot} />
          <p><b>실시간 일정</b> · 선배 팀이 반영한 최신 수업 정보입니다.</p>
          <time>{new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date())} 기준</time>
        </div>

        <div className={styles.dashboard}>
          <section className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><p>YOUR WEEK</p><h2>주간 수업 일정</h2></div>
              <div className={styles.weekNav}>
                <button type="button" onClick={() => moveWeek(-1)} aria-label="이전 주">←</button>
                <span>{week[0].month}월 {week[0].day}일 – {week[4].month}월 {week[4].day}일</span>
                <button type="button" onClick={() => moveWeek(1)} aria-label="다음 주">→</button>
              </div>
            </div>

            <div className={styles.days}>
              {week.map((day) => {
                const count = weekSessions.filter((session) => session.sessionDate === day.key).length;
                return (
                  <button
                    type="button"
                    className={selectedDate === day.key ? styles.selectedDay : ""}
                    onClick={() => setSelectedDate(day.key)}
                    key={day.key}
                  >
                    <small>{day.weekday}</small><b>{day.day}</b>{count > 0 && <span>{count}</span>}
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

function getWeek(offset: number) {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1 + offset * 7);
  return Array.from({ length: 5 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      key: localDateKey(date),
      weekday: ["월", "화", "수", "목", "금"][index],
      month: date.getMonth() + 1,
      day: date.getDate(),
    };
  });
}

function todayKey() {
  const now = new Date();
  const day = now.getDay();
  if (day === 0 || day === 6) {
    const week = getWeek(0);
    return week[0].key;
  }
  return localDateKey(now);
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

function formatHours(value: number) {
  return Number.isInteger(value) ? `${value}h` : `${value.toFixed(1)}h`;
}

function initials(value: string) {
  const clean = value.trim();
  if (!clean) return "선";
  if (/^[가-힣]/.test(clean)) return clean.slice(-2);
  return clean.split(/\s+/).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}

"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import styles from "./sessions.module.css";

export type AdminParent = {
  id: string;
  full_name: string | null;
  email: string;
};

export type AdminConsultation = {
  id: number;
  parent_id: string;
  session_date: string;
  starts_at: string;
  duration_minutes: number;
  actual_minutes: number | null;
  topic: string;
  title: string;
  notes: string | null;
  zoom_meeting_number: string | null;
  zoom_status: string;
};

export type AdminFamilyLink = {
  parent_id: string;
  student_id: string;
};

export default function AdminConsultationPanel({
  parents,
  students,
  initialFamilyLinks,
  initialConsultations,
  zoomConfigured,
}: {
  parents: AdminParent[];
  students: AdminParent[];
  initialFamilyLinks: AdminFamilyLink[];
  initialConsultations: AdminConsultation[];
  zoomConfigured: boolean;
}) {
  const [consultations, setConsultations] = useState(initialConsultations);
  const [familyLinks, setFamilyLinks] = useState(initialFamilyLinks);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    parentId: parents[0]?.id || "",
    sessionDate: nextDateKey(),
    startsAt: "19:00",
    durationMinutes: 45,
    topic: "학습 방향 및 튜터 매칭",
    title: "보호자 상담",
    notes: "",
  });
  const [familyForm, setFamilyForm] = useState({
    parentId: parents[0]?.id || "",
    studentId: students[0]?.id || "",
  });

  function update<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  async function createConsultation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "상담 일정을 만들지 못했습니다.");
        return;
      }
      setConsultations((current) => [
        result as AdminConsultation,
        ...current,
      ]);
      setForm((current) => ({ ...current, notes: "" }));
      setMessage("보호자 전용 Zoom 상담을 생성했습니다.");
    } catch {
      setMessage("상담 일정을 만들지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelConsultation(consultation: AdminConsultation) {
    if (!window.confirm(`"${consultation.title}" 상담을 취소할까요?`)) return;
    const response = await fetch(
      `/api/admin/consultations?id=${consultation.id}`,
      { method: "DELETE" },
    );
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "상담을 취소하지 못했습니다.");
      return;
    }
    setConsultations((current) =>
      current.map((item) =>
        item.id === consultation.id
          ? { ...item, zoom_status: "cancelled" }
          : item,
      ),
    );
    setMessage("상담을 취소했습니다.");
  }

  async function connectFamily(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/admin/family-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(familyForm),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "가족 계정을 연결하지 못했습니다.");
      return;
    }
    setFamilyLinks((current) =>
      current.some(
        (link) =>
          link.parent_id === result.parent_id
          && link.student_id === result.student_id,
      )
        ? current
        : [...current, result as AdminFamilyLink],
    );
    setMessage("보호자와 학생 계정을 연결했습니다.");
  }

  async function disconnectFamily(link: AdminFamilyLink) {
    const response = await fetch(
      `/api/admin/family-links?parentId=${encodeURIComponent(link.parent_id)}&studentId=${encodeURIComponent(link.student_id)}`,
      { method: "DELETE" },
    );
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "가족 연결을 해제하지 못했습니다.");
      return;
    }
    setFamilyLinks((current) =>
      current.filter(
        (item) =>
          item.parent_id !== link.parent_id
          || item.student_id !== link.student_id,
      ),
    );
    setMessage("가족 계정 연결을 해제했습니다.");
  }

  return (
    <section className={styles.consultationWorkspace}>
      <header>
        <p>FAMILY CONSULTATION</p>
        <h2>보호자–창업팀 상담</h2>
        <span>
          튜터–학생 수업과 분리된 전용 회의를 만들고 관리합니다.
        </span>
      </header>
      <div className={styles.workspace}>
        <form className={styles.creator} onSubmit={createConsultation}>
          <div className={styles.sectionHeading}>
            <p>CREATE CONSULTATION</p>
            <h2>새 보호자 상담</h2>
          </div>
          <div className={styles.formGrid}>
            <label className={styles.full}>
              <span>보호자</span>
              <select
                value={form.parentId}
                onChange={(event) => update("parentId", event.target.value)}
                required
              >
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.full_name || parent.email} · {parent.email}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>상담 날짜</span>
              <input
                type="date"
                min={todayKey()}
                value={form.sessionDate}
                onChange={(event) => update("sessionDate", event.target.value)}
                required
              />
            </label>
            <label>
              <span>시작 시각</span>
              <input
                type="time"
                value={form.startsAt}
                onChange={(event) => update("startsAt", event.target.value)}
                required
              />
            </label>
            <label>
              <span>상담 시간</span>
              <select
                value={form.durationMinutes}
                onChange={(event) =>
                  update("durationMinutes", Number(event.target.value))
                }
              >
                <option value={30}>30분</option>
                <option value={45}>45분</option>
                <option value={60}>60분</option>
                <option value={90}>90분</option>
              </select>
            </label>
            <label>
              <span>상담 주제</span>
              <input
                value={form.topic}
                onChange={(event) => update("topic", event.target.value)}
                required
              />
            </label>
            <label className={styles.full}>
              <span>상담 제목</span>
              <input
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                required
              />
            </label>
            <label className={styles.full}>
              <span>전달 사항</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
              />
            </label>
          </div>
          <button
            className={styles.createButton}
            type="submit"
            disabled={saving || !zoomConfigured || !parents.length}
          >
            {saving ? "상담 생성 중…" : "보호자 상담 생성"} <span>→</span>
          </button>
          <p className={styles.formMessage}>
            {message
              || (!parents.length
                ? "등록된 보호자 계정이 없습니다."
                : "생성 즉시 보호자 포털에 반영됩니다.")}
          </p>
        </form>

        <section className={styles.schedule}>
          <div className={styles.sectionHeading}>
            <p>CONSULTATION SCHEDULE</p>
            <h2>상담 일정</h2>
          </div>
          <div className={styles.lessonList}>
            {consultations.length ? (
              consultations.map((consultation) => {
                const parent = parents.find(
                  (item) => item.id === consultation.parent_id,
                );
                return (
                  <article key={consultation.id}>
                    <time>
                      <b>{consultation.session_date}</b>
                      <span>
                        {consultation.starts_at.slice(0, 5)} ·{" "}
                        {consultation.duration_minutes}분
                      </span>
                    </time>
                    <div>
                      <h3>{consultation.title}</h3>
                      <p>
                        {parent?.full_name || parent?.email || "보호자"} ·{" "}
                        {consultation.topic}
                      </p>
                    </div>
                    <span className={styles[statusClass(consultation.zoom_status)]}>
                      {statusLabel(consultation.zoom_status)}
                    </span>
                    {consultation.zoom_status !== "cancelled"
                      && consultation.zoom_status !== "ended" && (
                        <>
                          <Link
                            href={`/portal/consultation/${consultation.id}`}
                          >
                            회의 열기
                          </Link>
                          <button
                            type="button"
                            onClick={() => cancelConsultation(consultation)}
                          >
                            취소
                          </button>
                        </>
                      )}
                  </article>
                );
              })
            ) : (
              <div className={styles.empty}>아직 생성한 상담이 없습니다.</div>
            )}
          </div>
        </section>
      </div>
      <form className={styles.familyManager} onSubmit={connectFamily}>
        <div>
          <p>FAMILY LINK</p>
          <h3>보호자–학생 연결</h3>
          <span>연결된 보호자는 해당 학생의 수업 일정을 볼 수 있습니다.</span>
        </div>
        <select
          value={familyForm.parentId}
          onChange={(event) =>
            setFamilyForm((current) => ({
              ...current,
              parentId: event.target.value,
            }))
          }
          required
        >
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              보호자 · {parent.full_name || parent.email}
            </option>
          ))}
        </select>
        <select
          value={familyForm.studentId}
          onChange={(event) =>
            setFamilyForm((current) => ({
              ...current,
              studentId: event.target.value,
            }))
          }
          required
        >
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              학생 · {student.full_name || student.email}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!parents.length || !students.length}
        >
          계정 연결
        </button>
        <div className={styles.familyLinks}>
          {familyLinks.map((link) => {
            const parent = parents.find((item) => item.id === link.parent_id);
            const student = students.find(
              (item) => item.id === link.student_id,
            );
            return (
              <span key={`${link.parent_id}:${link.student_id}`}>
                {parent?.full_name || parent?.email} →{" "}
                {student?.full_name || student?.email}
                <button type="button" onClick={() => disconnectFamily(link)}>
                  해제
                </button>
              </span>
            );
          })}
        </div>
      </form>
    </section>
  );
}

function todayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function nextDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

function statusLabel(value: string) {
  if (value === "live") return "진행 중";
  if (value === "ended") return "종료";
  if (value === "cancelled") return "취소";
  return "예정";
}

function statusClass(value: string) {
  if (value === "live") return "live";
  if (value === "cancelled" || value === "ended") return "inactive";
  return "scheduled";
}

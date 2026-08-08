"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../parent.module.css";

export type LinkedStudent = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type Method = "phone" | "email";

export default function FamilyLinkClient({
  linkedStudents,
}: {
  linkedStudents: LinkedStudent[];
}) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>("phone");
  const [target, setTarget] = useState("");
  const [challenge, setChallenge] = useState("");
  const [token, setToken] = useState("");
  const [phase, setPhase] = useState<"identify" | "verify" | "success">("identify");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/parent-link/request", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, target }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "인증 요청을 보내지 못했습니다.");
        return;
      }
      setChallenge(result.challenge);
      setMessage(result.message);
      setPhase("verify");
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/parent-link/verify", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, token }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "인증번호를 확인하지 못했습니다.");
        return;
      }
      setPhase("success");
      setMessage(result.message);
      router.refresh();
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  function restart() {
    setPhase("identify");
    setChallenge("");
    setToken("");
    setMessage("");
  }

  return (
    <div className={styles.twoColumn}>
      <section className={styles.panel}>
        <div className={styles.sectionHeading}>
          <span>현재 연결</span>
          <h2>연결된 학생</h2>
        </div>
        {linkedStudents.length ? (
          <div className={styles.studentList}>
            {linkedStudents.map((student) => (
              <article key={student.id}>
                <span className={styles.studentInitial}>{student.name.slice(-2)}</span>
                <div>
                  <strong>{student.name}</strong>
                  <p>{student.email}</p>
                </div>
                <small>{student.phone}</small>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <strong>연결된 학생이 없습니다.</strong>
            <p>오른쪽 인증 절차를 완료하면 학생 일정과 리포트가 포털에 표시됩니다.</p>
          </div>
        )}
      </section>

      <section className={`${styles.panel} ${styles.verificationPanel}`}>
        <div className={styles.sectionHeading}>
          <span>2단계 확인</span>
          <h2>{phase === "success" ? "연결 완료" : "새 학생 연결"}</h2>
        </div>

        {phase === "identify" && (
          <form className={styles.form} onSubmit={requestOtp}>
            <fieldset className={styles.methodChoice}>
              <legend>인증 방법</legend>
              <label data-selected={method === "phone"}>
                <input
                  type="radio"
                  name="family-method"
                  value="phone"
                  checked={method === "phone"}
                  onChange={() => {
                    setMethod("phone");
                    setTarget("");
                  }}
                />
                <span><b>휴대전화 OTP</b><small>문자 인증번호 입력</small></span>
              </label>
              <label data-selected={method === "email"}>
                <input
                  type="radio"
                  name="family-method"
                  value="email"
                  checked={method === "email"}
                  onChange={() => {
                    setMethod("email");
                    setTarget("");
                  }}
                />
                <span><b>이메일 OTP</b><small>번호 입력 또는 승인 링크</small></span>
              </label>
            </fieldset>

            <label className={styles.field}>
              <span>{method === "phone" ? "학생 휴대전화번호" : "학생 이메일"}</span>
              <input
                type={method === "phone" ? "tel" : "email"}
                inputMode={method === "phone" ? "tel" : "email"}
                autoComplete={method === "phone" ? "tel" : "email"}
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                placeholder={method === "phone" ? "01012345678" : "student@example.com"}
                required
              />
              <small>학생 계정에 등록된 정보와 정확히 일치해야 합니다.</small>
            </label>

            {message && <p className={styles.formMessage} role="alert">{message}</p>}
            <button className={styles.primaryButton} type="submit" disabled={busy}>
              {busy ? "전송 중" : "인증 요청"}
            </button>
          </form>
        )}

        {phase === "verify" && (
          <form className={styles.form} onSubmit={verifyOtp}>
            <div className={styles.notice}>
              <strong>{message}</strong>
              <p>
                {method === "email"
                  ? "학생이 이메일의 승인 링크를 눌러도 연결이 완료됩니다."
                  : "인증번호는 10분 동안 사용할 수 있습니다."}
              </p>
            </div>
            <label className={styles.field}>
              <span>6자리 인증번호</span>
              <input
                className={styles.otpInput}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={token}
                onChange={(event) => setToken(event.target.value.replace(/\D/g, "").slice(0, 8))}
                minLength={6}
                maxLength={8}
                required
              />
            </label>
            {message && message.includes("올바르지") && (
              <p className={styles.formMessage} role="alert">{message}</p>
            )}
            <div className={styles.formActions}>
              <button className={styles.secondaryButton} type="button" onClick={restart}>
                다시 입력
              </button>
              <button className={styles.primaryButton} type="submit" disabled={busy || token.length < 6}>
                {busy ? "확인 중" : "연결 확인"}
              </button>
            </div>
          </form>
        )}

        {phase === "success" && (
          <div className={styles.successState} role="status">
            <span aria-hidden="true">✓</span>
            <strong>{message || "학생 계정이 연결되었습니다."}</strong>
            <p>일정과 수업 리포트가 보호자 포털에 반영됩니다.</p>
            <button className={styles.primaryButton} type="button" onClick={restart}>
              다른 학생 연결
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

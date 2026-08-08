"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../parent.module.css";

export type BillingLineItem = {
  id: number;
  date: string;
  title: string;
  subject: string;
  studentName: string;
  tutorName: string;
  minutes: number;
  amountKrw: number | null;
  status: "confirmed" | "scheduled";
};

type Method = "email" | "phone";

export default function BillingClient({
  locked,
  accessExpiresAt,
  methods,
  items,
}: {
  locked: boolean;
  accessExpiresAt: number | null;
  methods: { email: boolean; phone: boolean };
  items: BillingLineItem[];
}) {
  if (locked) return <BillingGate methods={methods} />;
  return <BillingLedger accessExpiresAt={accessExpiresAt} items={items} />;
}

function BillingGate({ methods }: { methods: { email: boolean; phone: boolean } }) {
  const router = useRouter();
  const initialMethod: Method = methods.phone ? "phone" : "email";
  const [method, setMethod] = useState<Method>(initialMethod);
  const [challenge, setChallenge] = useState("");
  const [token, setToken] = useState("");
  const [destination, setDestination] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function requestOtp() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing-access/request", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.error || "인증 요청을 보내지 못했습니다.");
        return;
      }
      setChallenge(result.challenge);
      setDestination(result.destination);
      setMessage(result.message);
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
      const response = await fetch("/api/billing-access/verify", {
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
      router.refresh();
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${styles.panel} ${styles.billingGate}`}>
      <div className={styles.lockMark} aria-hidden="true"><span /></div>
      <div className={styles.gateCopy}>
        <span>민감 정보 보호</span>
        <h2>결제 내역이 잠겨 있습니다.</h2>
        <p>등록된 연락처로 본인 확인을 완료하면 12시간 동안 이 기기에서 결제 내역을 확인할 수 있습니다.</p>
      </div>

      <div className={styles.gateForm}>
        <fieldset className={styles.methodChoice}>
          <legend>인증 방법</legend>
          <label data-selected={method === "phone"} data-disabled={!methods.phone}>
            <input
              type="radio"
              name="billing-method"
              value="phone"
              checked={method === "phone"}
              disabled={!methods.phone}
              onChange={() => {
                setMethod("phone");
                setChallenge("");
              }}
            />
            <span><b>휴대전화</b><small>문자 OTP</small></span>
          </label>
          <label data-selected={method === "email"} data-disabled={!methods.email}>
            <input
              type="radio"
              name="billing-method"
              value="email"
              checked={method === "email"}
              disabled={!methods.email}
              onChange={() => {
                setMethod("email");
                setChallenge("");
              }}
            />
            <span><b>이메일</b><small>OTP 또는 링크</small></span>
          </label>
        </fieldset>

        {!challenge ? (
          <button className={styles.primaryButton} type="button" onClick={requestOtp} disabled={busy}>
            {busy ? "전송 중" : "인증번호 받기"}
          </button>
        ) : (
          <form className={styles.form} onSubmit={verifyOtp}>
            <div className={styles.notice}>
              <strong>{destination}</strong>
              <p>{message}</p>
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
            <button className={styles.primaryButton} type="submit" disabled={busy || token.length < 6}>
              {busy ? "확인 중" : "잠금 해제"}
            </button>
          </form>
        )}
        {message && !challenge && <p className={styles.formMessage} role="alert">{message}</p>}
      </div>
    </section>
  );
}

function BillingLedger({
  accessExpiresAt,
  items,
}: {
  accessExpiresAt: number | null;
  items: BillingLineItem[];
}) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const months = useMemo(() => {
    const values = new Set(items.map((item) => item.date.slice(0, 7)));
    values.add(currentMonth);
    return Array.from(values).sort().reverse();
  }, [items, currentMonth]);
  const [month, setMonth] = useState(months[0]);
  const [paymentNotice, setPaymentNotice] = useState(false);
  const monthItems = items.filter((item) => item.date.startsWith(month));
  const totalMinutes = monthItems.reduce((sum, item) => sum + item.minutes, 0);
  const pricedItems = monthItems.filter((item) => item.amountKrw !== null);
  const totalAmount = pricedItems.reduce((sum, item) => sum + (item.amountKrw || 0), 0);
  const allPriced = monthItems.length > 0 && pricedItems.length === monthItems.length;

  return (
    <>
      <section className={styles.securityStrip}>
        <div>
          <strong>본인 확인 완료</strong>
          <span>
            {accessExpiresAt
              ? `${formatSeoulTime(accessExpiresAt)}까지 열림`
              : "보안 세션 활성화"}
          </span>
        </div>
        <p>기기 또는 로그인 지역이 크게 바뀌면 다시 인증합니다.</p>
      </section>

      <section className={styles.panel}>
        <div className={styles.billingHeader}>
          <div className={styles.sectionHeading}>
            <span>월별 명세</span>
            <h2>{formatMonth(month)} 수업료</h2>
          </div>
          <label className={styles.monthSelect}>
            <span>결제 월</span>
            <select value={month} onChange={(event) => setMonth(event.target.value)}>
              {months.map((value) => <option key={value} value={value}>{formatMonth(value)}</option>)}
            </select>
          </label>
        </div>

        {monthItems.length ? (
          <div className={styles.invoiceTable} role="table" aria-label={`${formatMonth(month)} 수업료 내역`}>
            <div className={styles.invoiceHead} role="row">
              <span role="columnheader">수업일</span>
              <span role="columnheader">학생 / 튜터</span>
              <span role="columnheader">수업</span>
              <span role="columnheader">시간</span>
              <span role="columnheader">금액</span>
            </div>
            {monthItems.map((item) => (
              <article className={styles.invoiceRow} role="row" key={item.id}>
                <time role="cell">{formatDate(item.date)}</time>
                <div role="cell"><strong>{item.studentName}</strong><span>{item.tutorName} 튜터</span></div>
                <div role="cell"><strong>{item.title}</strong><span>{item.subject}</span></div>
                <strong role="cell">{formatMinutes(item.minutes)}</strong>
                <strong role="cell">{item.amountKrw === null ? "확정 전" : formatKrw(item.amountKrw)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <strong>이 달에 청구할 수업이 없습니다.</strong>
            <p>수업 일정이 등록되면 학생, 튜터, 수업 시간과 금액이 이곳에 표시됩니다.</p>
          </div>
        )}

        <div className={styles.invoiceSummary}>
          <dl>
            <div><dt>수업 수</dt><dd>{monthItems.length}회</dd></div>
            <div><dt>총 수업 시간</dt><dd>{formatMinutes(totalMinutes)}</dd></div>
            <div className={styles.grandTotal}><dt>결제 예정 금액</dt><dd>{allPriced ? formatKrw(totalAmount) : "금액 확정 전"}</dd></div>
          </dl>
          <div className={styles.paymentAction}>
            <button
              className={styles.payButton}
              type="button"
              disabled={!monthItems.length || !allPriced}
              onClick={() => setPaymentNotice(true)}
            >
              결제하기
            </button>
            <small>결제 게이트웨이 연결 후 사용할 수 있습니다.</small>
          </div>
        </div>

        {paymentNotice && (
          <p className={styles.formMessage} role="status">
            결제 게이트웨이는 다음 단계에서 연결됩니다.
          </p>
        )}
      </section>
    </>
  );
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");
  return `${year}년 ${Number(month)}월`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" })
    .format(new Date(`${value}T00:00:00`));
}

function formatMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (!hours) return `${minutes}분`;
  return minutes ? `${hours}시간 ${minutes}분` : `${hours}시간`;
}

function formatKrw(value: number) {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function formatSeoulTime(epochSeconds: number) {
  const date = new Date(epochSeconds * 1000);
  const totalMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + 9 * 60;
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import styles from "./login.module.css";

type LoginMode = "user" | "admin";
type UserAction = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [mode, setMode] = useState<LoginMode>("user");
  const [action, setAction] = useState<UserAction>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const requestedMode = new URLSearchParams(window.location.search).get("mode");
    if (requestedMode === "admin") setMode("admin");
  }, []);

  function changeMode(nextMode: LoginMode) {
    setMode(nextMode);
    setAction("signin");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    if (mode === "user" && action === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: `${window.location.origin}/portal`,
        },
      });

      if (error) {
        setMessage(authMessage(error.message));
      } else if (data.session) {
        router.replace("/portal");
        router.refresh();
      } else {
        setMessage("확인 메일을 보냈습니다. 이메일 인증을 마치면 포털에 로그인할 수 있습니다.");
      }
      setBusy(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setMessage("이메일 또는 비밀번호를 다시 확인해 주세요.");
      setBusy(false);
      return;
    }

    if (mode === "admin") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        setMessage("관리자로 승인된 계정만 이 화면에서 로그인할 수 있습니다.");
        setBusy(false);
        return;
      }

      router.replace("/admin");
    } else {
      router.replace("/portal");
    }
    router.refresh();
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/#/ko/home" aria-label="선배 홈">
          <img src="/seonbae-logo-antique.png" alt="" />
          <span className={styles.brandKo}>선배</span>
          <span className={styles.brandRule} />
          <span className={styles.brandEn}>SEONBAE<small>EST. 2026</small></span>
        </Link>
        <Link className={styles.back} href="/#/ko/home">홈으로 돌아가기 <span aria-hidden="true">↗</span></Link>
      </header>

      <section className={styles.authHero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>SEONBAE LEARNING PORTAL</p>
          <h1>수업의 흐름을<br /><em>한곳에서.</em></h1>
          <p className={styles.intro}>
            예정된 수업, 담당 튜터, 수업 시간과 전달 사항을 한눈에 확인하세요.
            상담에서 시작된 학습 계획이 실제 수업까지 끊기지 않도록 정리합니다.
          </p>
          <div className={styles.benefits}>
            <article><span>01</span><div><b>주간 수업 일정</b><p>이번 주 수업과 변경 사항을 날짜별로 확인합니다.</p></div></article>
            <article><span>02</span><div><b>담당 튜터 정보</b><p>수업별 담당 튜터와 과목을 바로 확인합니다.</p></div></article>
            <article><span>03</span><div><b>중앙 관리</b><p>선배 팀이 업데이트한 일정이 포털에 반영됩니다.</p></div></article>
          </div>
        </div>

        <div className={styles.loginSurface}>
          <div className={styles.modeTabs} role="tablist" aria-label="로그인 유형">
            <button type="button" role="tab" aria-selected={mode === "user"} onClick={() => changeMode("user")}>사용자</button>
            <button type="button" role="tab" aria-selected={mode === "admin"} onClick={() => changeMode("admin")}>관리자</button>
          </div>

          <div className={styles.formHeading}>
            <p>{mode === "admin" ? "ADMIN ACCESS" : "MEMBER ACCESS"}</p>
            <h2>{mode === "admin" ? "관리자 로그인" : action === "signup" ? "계정 만들기" : "포털 로그인"}</h2>
            <span>
              {mode === "admin"
                ? "승인된 운영진 계정으로 튜터 명부를 관리합니다."
                : "수업 일정과 담당 튜터 정보를 안전하게 확인합니다."}
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "user" && action === "signup" && (
              <label>
                <span>이름</span>
                <input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required />
              </label>
            )}
            <label>
              <span>이메일</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            <label>
              <span>비밀번호</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={action === "signup" ? "new-password" : "current-password"} minLength={8} required />
            </label>
            {message && <p className={styles.formMessage} role="status">{message}</p>}
            <button className={styles.submit} type="submit" disabled={busy}>
              <span>{busy ? "확인 중..." : mode === "admin" ? "관리자 로그인" : action === "signup" ? "계정 만들기" : "로그인"}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </form>

          {mode === "user" && (
            <button className={styles.switchAction} type="button" onClick={() => { setAction(action === "signin" ? "signup" : "signin"); setMessage(""); }}>
              {action === "signin" ? "처음이신가요? 계정 만들기" : "이미 계정이 있나요? 로그인"}
            </button>
          )}

          <p className={styles.secure}>암호화된 Supabase 인증 · 권한별 접근 제어</p>
        </div>
      </section>

      <section className={styles.preview}>
        <div className={styles.previewHeading}>
          <p>AFTER SIGN-IN</p>
          <h2>로그인하면 이런 화면이 열립니다.</h2>
          <span>수업에 필요한 정보만 정돈한 개인 포털입니다.</span>
        </div>
        <div className={styles.previewBoard}>
          <div className={styles.previewTop}>
            <div><span>이번 주</span><b>나의 수업 일정</b></div>
            <small>LIVE · 선배 팀과 동기화</small>
          </div>
          <div className={styles.previewGrid}>
            <article className={styles.weekCard}>
              <div className={styles.days}>
                {["월 20", "화 21", "수 22", "목 23", "금 24"].map((day, index) => <span className={index === 2 ? styles.activeDay : ""} key={day}>{day}</span>)}
              </div>
              <div className={styles.sampleLesson}><time>16:00</time><div><b>IB Mathematics AA HL</b><p>담당 튜터 · 수업 시간 · 온라인 링크</p></div><span>60분</span></div>
              <div className={styles.sampleLesson}><time>19:30</time><div><b>Digital SAT Reading</b><p>수업 전 전달 사항과 준비물</p></div><span>45분</span></div>
            </article>
            <aside className={styles.nextCard}><span>UP NEXT</span><h3>다음 수업</h3><b>IB Mathematics AA HL</b><p>수요일 16:00 · 온라인</p><small>로그인 후 실제 일정이 표시됩니다.</small></aside>
          </div>
          <div className={styles.lock}><span aria-hidden="true">⌁</span> 개인 일정은 로그인한 사용자에게만 공개됩니다.</div>
        </div>
      </section>
    </main>
  );
}

function authMessage(message: string) {
  if (message.toLowerCase().includes("already registered")) return "이미 가입된 이메일입니다. 로그인해 주세요.";
  if (message.toLowerCase().includes("password")) return "비밀번호는 8자 이상으로 입력해 주세요.";
  return "계정을 만들지 못했습니다. 입력한 정보를 다시 확인해 주세요.";
}

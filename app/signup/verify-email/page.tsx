import Link from "next/link";
import styles from "../verification.module.css";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const safeEmail = typeof email === "string" && email.length <= 254 ? email : "가입한 이메일";

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Link className={styles.brand} href="/"><img src="/logo.png" alt="" width="40" height="40" /> Seonbae</Link>
        <section className={styles.card}>
          <p className={styles.eyebrow}>ONE LAST STEP</p>
          <h1>이메일을 확인해 주세요.</h1>
          <p className={styles.description}>가입 정보와 심사 요청은 안전하게 접수되었습니다. 인증 링크를 누르면 이메일 확인이 완료됩니다.</p>
          <strong className={styles.email}>{safeEmail}</strong>
          <ol className={styles.steps}>
            <li><b>1</b><span>받은편지함에서 선배 인증 메일을 찾습니다.</span></li>
            <li><b>2</b><span>메일 안의 인증 버튼을 누릅니다.</span></li>
            <li><b>3</b><span>인증 완료 페이지에서 자동으로 홈으로 이동합니다.</span></li>
          </ol>
          <div className={styles.actions}>
            <a className={styles.primary} href="https://mail.google.com/" target="_blank" rel="noreferrer">Gmail 열기</a>
            <Link className={styles.secondary} href="/">홈으로 돌아가기</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

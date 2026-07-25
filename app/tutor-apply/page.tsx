import type { Metadata } from "next";
import Link from "next/link";
import TutorApplicationForm from "./TutorApplicationForm";
import styles from "./tutor-apply.module.css";

export const metadata: Metadata = {
  title: "튜터 지원 — 선배",
  description:
    "직접 통과한 시험과 입시 경험을 다음 학생에게 전할 선배 튜터를 모집합니다.",
};

const requirements = [
  {
    number: "01",
    title: "공식 성적 확인",
    body: "지원 과목과 연결되는 공식 성적표 또는 시험기관 리포트를 확인합니다.",
  },
  {
    number: "02",
    title: "재학·졸업 확인",
    body: "대학교 재학증명서 또는 졸업증명서로 현재 소속과 학력을 확인합니다.",
  },
  {
    number: "03",
    title: "면접과 모의 수업",
    body: "점수뿐 아니라 설명하는 힘, 준비 태도, 학생에 대한 책임감을 함께 봅니다.",
  },
];

export default function TutorApplyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.utility}>EDUCATION TO THE WORLD — SEONBAE 2026</div>
      <header className={styles.header}>
        <Link className={styles.brand} href="/#/ko/home" aria-label="선배 홈">
          <img src="/seonbae-logo-antique.png" alt="" />
          <strong>선배</strong>
          <i />
          <span>
            SEONBAE<small>EST. 2026</small>
          </span>
        </Link>
        <nav aria-label="주요 메뉴">
          <Link href="/#/ko/home">홈</Link>
          <div className={styles.tutorMenu}>
            <Link className={styles.active} href="/#/ko/tutors">
              튜터
            </Link>
            <div className={styles.tutorDropdown}>
              <Link href="/#/ko/tutors">튜터 찾기</Link>
              <Link aria-current="page" href="/tutor-apply">
                튜터 지원하기
              </Link>
            </div>
          </div>
          <Link href="/#/ko/about">선배 소개</Link>
          <Link href="/#/ko/consult">상담 신청</Link>
        </nav>
        <Link className={styles.login} href="/login">
          로그인
        </Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>BECOME A SEONBAE TUTOR</p>
          <h1>
            먼저 걸어본 길을,
            <br />
            <em>다음 학생에게.</em>
          </h1>
          <p>
            높은 점수만으로는 충분하지 않습니다. 자신이 직접 통과한 시험을 정확하게
            설명하고, 학생의 학습 과정을 끝까지 책임질 선배를 찾습니다.
          </p>
          <a href="#application">
            지원서 작성하기 <span aria-hidden="true">↘</span>
          </a>
        </div>
        <aside className={styles.heroNote}>
          <span>SEONBAE STANDARD</span>
          <strong>성적표 · 재학증명 · 면접</strong>
          <p>세 단계가 확인된 뒤 튜터 명부에 등재됩니다.</p>
        </aside>
      </section>

      <section className={styles.requirements}>
        <header>
          <p>지원 절차</p>
          <h2>누구나 지원할 수 있지만,<br />확인 없이 등재되지는 않습니다.</h2>
        </header>
        <div className={styles.requirementGrid}>
          {requirements.map((item) => (
            <article key={item.number}>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.application} id="application">
        <div className={styles.applicationIntro}>
          <p className={styles.eyebrow}>APPLICATION</p>
          <h2>튜터 지원하기</h2>
          <p>
            기본 정보를 보내주시면 담당자가 확인 후 다음 절차를 안내합니다. 성적표와
            재학증명서는 첫 회신 이후 안전한 방법으로 별도 요청드립니다.
          </p>
          <div>
            <span>문의</span>
            <a href="mailto:admissions@seonbae.com">admissions@seonbae.com</a>
          </div>
        </div>
        <TutorApplicationForm />
      </section>

      <footer className={styles.footer}>
        <div>
          <strong>선배</strong>
          <span>© 2026 SEONBAE · SEOUL, REPUBLIC OF KOREA</span>
        </div>
        <nav>
          <Link href="/#/ko/tutors">튜터 찾기</Link>
          <Link href="/#/ko/about/founders">팀 소개</Link>
          <Link href="/#/ko/consult">상담 신청</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
          <Link href="/terms">이용약관</Link>
        </nav>
      </footer>
    </main>
  );
}

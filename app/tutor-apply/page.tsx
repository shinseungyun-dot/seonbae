import Link from "next/link";
import TutorApplicationForm from "./TutorApplicationForm";
import styles from "./tutor-apply.module.css";

export const metadata = {
  title: "튜터 지원 | 선배 Seonbae",
  description: "선배 튜터 지원서를 접수합니다. 심사 후 선배 팀이 튜터 계정을 만들어 드립니다.",
};

const requirements = [
  {
    tag: "01",
    title: "재학 증명",
    copy: "서울대·고려대·연세대 재학생이어야 하며, 학교 이메일과 합격통지서로 확인합니다.",
  },
  {
    tag: "02",
    title: "성적 원본",
    copy: "지원 커리큘럼의 공식 성적표 원본을 제출해야 합니다. 사본이나 요약본은 받지 않습니다.",
  },
  {
    tag: "03",
    title: "면접",
    copy: "서류 검토를 통과하면 1:1 면접을 진행합니다. 승인 후 선배 팀이 계정을 만들어 드립니다.",
  },
];

export default function TutorApplyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.utility}>EDUCATION TO THE WORLD</div>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>TUTOR APPLICATION</p>
          <h1>
            가르치는 <em>선배</em>가 되어 주세요.
          </h1>
          <p>
            선배 튜터는 지원서와 서류 검토, 면접을 거쳐 선발됩니다. 아래 지원서를 제출해 주시면 영업일
            기준 이틀 안에 연락드립니다.
          </p>
          <Link href="#apply">
            지원서 작성하기 <span aria-hidden="true">↓</span>
          </Link>
        </div>
        <aside className={styles.heroNote}>
          <span>ACCOUNT</span>
          <strong>계정은 심사 후 만들어집니다.</strong>
          <p>
            이 페이지에서는 계정이 생성되지 않습니다. 승인되면 선배 팀이 튜터 계정을 만들고 임시
            비밀번호를 이메일로 보내드립니다.
          </p>
        </aside>
      </section>

      <section className={styles.requirements}>
        <header>
          <p>REQUIREMENTS</p>
          <h2>검증을 통과한 선배만 등록됩니다.</h2>
        </header>
        <div className={styles.requirementGrid}>
          {requirements.map((item) => (
            <article key={item.tag}>
              <span>{item.tag}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.application} id="apply">
        <div className={styles.applicationIntro}>
          <p className={styles.eyebrow}>APPLY</p>
          <h2>지원을 시작하세요.</h2>
          <p>
            학교 이메일, 합격통지서, 공식 성적표를 함께 제출해 주세요. 자격 검증은 지원 단계에서 한 번에
            끝나며, 승인 뒤 따로 서류를 올릴 필요가 없습니다.
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
          <span>SEONBAE 2026</span>
        </div>
        <nav>
          <Link href="/">홈</Link>
          <Link href="/become-a-tutor">튜터 안내</Link>
          <Link href="/privacy">개인정보 처리방침</Link>
          <Link href="/terms">이용약관</Link>
        </nav>
      </footer>
    </main>
  );
}

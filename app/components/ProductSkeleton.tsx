import styles from "./product-skeleton.module.css";

export default function ProductSkeleton({ admin = false }: { admin?: boolean }) {
  return (
    <main className={admin ? styles.adminPage : styles.page} aria-label="화면 불러오는 중" aria-busy="true">
      {admin && <aside className={styles.sidebar}><span className={styles.logo} />{Array.from({ length: 5 }, (_, index) => <span className={styles.nav} key={index} />)}</aside>}
      <section className={styles.main}>
        <header className={styles.header}><span className={styles.logo} /><span className={styles.short} /></header>
        <div className={styles.hero}><span className={styles.kicker} /><span className={styles.title} /><span className={styles.copy} /></div>
        <div className={styles.grid}>
          <section className={styles.panel}>{Array.from({ length: 5 }, (_, index) => <span className={styles.row} key={index} />)}</section>
          <section className={styles.panel}>{Array.from({ length: 3 }, (_, index) => <span className={styles.row} key={index} />)}</section>
        </div>
      </section>
    </main>
  );
}

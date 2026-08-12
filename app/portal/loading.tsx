import styles from "./portal-loading.module.css";

export default function PortalLoading() {
  return (
    <main className={styles.page} aria-label="Loading portal content" aria-busy="true">
      <section className={styles.shell}>
        <header className={styles.heading}>
          <span className={`${styles.shimmer} ${styles.kicker}`} />
          <span className={`${styles.shimmer} ${styles.title}`} />
          <span className={`${styles.shimmer} ${styles.copy}`} />
        </header>

        <section className={styles.hero}>
          <div>
            <span className={`${styles.shimmer} ${styles.heroKicker}`} />
            <span className={`${styles.shimmer} ${styles.heroTitle}`} />
            <span className={`${styles.shimmer} ${styles.heroCopy}`} />
          </div>
          <div className={styles.stats}>
            {Array.from({ length: 3 }, (_, index) => (
              <span className={`${styles.shimmer} ${styles.stat}`} key={index} />
            ))}
          </div>
        </section>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <span className={`${styles.shimmer} ${styles.panelTitle}`} />
            <div className={styles.calendar}>
              {Array.from({ length: 35 }, (_, index) => (
                <span className={styles.day} key={index} />
              ))}
            </div>
          </section>
          <aside className={styles.side}>
            <span className={`${styles.shimmer} ${styles.panelTitle}`} />
            <span className={`${styles.shimmer} ${styles.row}`} />
            <span className={`${styles.shimmer} ${styles.row}`} />
            <span className={`${styles.shimmer} ${styles.row}`} />
          </aside>
        </div>
      </section>
    </main>
  );
}

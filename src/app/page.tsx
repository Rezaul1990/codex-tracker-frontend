import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Codex Tracker System</p>
          <h1>Frontend and backend are separated and ready.</h1>
          <p>
            This is a basic Next.js frontend connected to a Node.js Express API
            structure. Start both apps independently while you build features.
          </p>
        </section>

        <section className={styles.grid} aria-label="Project apps">
          <article className={styles.panel}>
            <span>Frontend</span>
            <h2>Next.js</h2>
            <p>Folder: frontend</p>
            <code>npm run dev</code>
          </article>
          <article className={styles.panel}>
            <span>Backend</span>
            <h2>Node.js API</h2>
            <p>Folder: backend</p>
            <code>npm run dev</code>
          </article>
        </section>
      </main>
    </div>
  );
}

import Link from "next/link";

import styles from "@/app/page.module.css";

export default function ForbiddenPage() {
  return (
    <main className={styles.page}>
      <section className={styles.authPanel}>
        <p className={styles.eyebrow}>Codex Tracker System</p>
        <h1>Forbidden</h1>
        <p>You do not have permission to access this page.</p>
        <Link href="/">Back to dashboard</Link>
      </section>
    </main>
  );
}

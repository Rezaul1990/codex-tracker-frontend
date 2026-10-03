import { FormEvent, ReactNode } from "react";

import styles from "@/app/page.module.css";

type AuthFormProps = {
  children: ReactNode;
  message?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
};

export function AuthForm({ children, message, onSubmit, title }: AuthFormProps) {
  return (
    <main className={styles.page}>
      <section className={styles.authPanel}>
        <p className={styles.eyebrow}>Codex Tracker System</p>
        <h1>{title}</h1>
        <form className={styles.form} onSubmit={onSubmit}>
          {children}
          {message ? <p className={styles.message}>{message}</p> : null}
        </form>
      </section>
    </main>
  );
}

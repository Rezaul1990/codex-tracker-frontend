"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import styles from "./page.module.css";

type Project = {
  _id: string;
  projectName: string;
  description: string;
  status: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/projects`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Could not load projects");
    }

    return result.data || [];
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitialProjects = async () => {
      try {
        const savedProjects = await fetchProjects();

        if (isMounted) {
          setProjects(savedProjects);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Could not load projects");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadInitialProjects();

    return () => {
      isMounted = false;
    };
  }, [fetchProjects]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectName,
          description,
          status,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Could not create project");
      }

      setProjectName("");
      setDescription("");
      setStatus("pending");
      setIsLoading(true);
      setProjects(await fetchProjects());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create project");
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <p className={styles.eyebrow}>Codex Tracker System</p>
        <h1>Project Tracker</h1>
        <p>Create a project and save it directly to this app&apos;s MongoDB database.</p>
      </section>

      <section className={styles.content}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Project name
            <input
              required
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Website redesign"
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Short project summary"
              rows={4}
            />
          </label>

          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="pending">Pending</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Create project"}
          </button>

          {message ? <p className={styles.message}>{message}</p> : null}
        </form>

        <div className={styles.listPanel}>
          <div className={styles.listHeader}>
            <h2>Saved projects</h2>
            <span>{projects.length}</span>
          </div>

          {isLoading ? (
            <p className={styles.empty}>Loading projects...</p>
          ) : projects.length === 0 ? (
            <p className={styles.empty}>No projects saved yet.</p>
          ) : (
            <ul className={styles.list}>
              {projects.map((project) => (
                <li key={project._id} className={styles.projectItem}>
                  <div>
                    <h3>{project.projectName}</h3>
                    <p>{project.description || "No description provided."}</p>
                  </div>
                  <span>{project.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

"use client";

import { FormEvent, useState } from "react";

import type { CreateProjectInput, ProjectStatus } from "@/types/project";
import styles from "@/app/page.module.css";

type ProjectFormProps = {
  errorMessage: string;
  isSubmitting: boolean;
  onSubmit: (input: CreateProjectInput) => Promise<boolean>;
};

const initialStatus: ProjectStatus = "pending";

export function ProjectForm({ errorMessage, isSubmitting, onSubmit }: ProjectFormProps) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [status, setStatus] = useState<ProjectStatus>(initialStatus);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const wasCreated = await onSubmit({
      projectName,
      description,
      dueDate,
      startDate,
      status,
    });

    if (!wasCreated) {
      return;
    }

    setProjectName("");
    setDescription("");
    setDueDate("");
    setStartDate("");
    setStatus(initialStatus);
  };

  return (
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
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ProjectStatus)}
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </label>

      <label>
        Start date
        <input
          type="date"
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </label>

      <label>
        Due date
        <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
      </label>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Create project"}
      </button>

      {errorMessage ? <p className={styles.message}>{errorMessage}</p> : null}
    </form>
  );
}

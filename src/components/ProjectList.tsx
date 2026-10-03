import Link from "next/link";

import type { Project, ProjectStatus } from "@/types/project";
import styles from "@/app/page.module.css";

type ProjectListProps = {
  canManageProjects: boolean;
  isLoading: boolean;
  onStatusChange: (projectId: string, status: ProjectStatus) => Promise<void>;
  projects: Project[];
  updatingProjectId: string;
};

const statusOptions: { label: string; value: ProjectStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
];

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export function ProjectList({
  canManageProjects,
  isLoading,
  onStatusChange,
  projects,
  updatingProjectId,
}: ProjectListProps) {
  return (
    <div className={styles.listPanel}>
      <div className={styles.listHeader}>
        <h2>Saved projects</h2>
        <span>{projects.length}</span>
      </div>

      {isLoading ? (
        <p className={styles.empty}>Loading projects...</p>
      ) : projects.length === 0 ? (
        <p className={styles.empty}>No active projects available.</p>
      ) : (
        <ul className={styles.list}>
          {projects.map((project) => (
            <li key={project._id} className={styles.projectItem}>
              <div className={styles.projectSummary}>
                <div className={styles.projectTitleRow}>
                  <h3>{project.projectName}</h3>
                  {project.archivedAt ? <span className={styles.archiveBadge}>Archived</span> : null}
                </div>
                <p>{project.description || "No description provided."}</p>
                <div className={styles.projectMeta}>
                  <span>Start: {formatDate(project.startDate)}</span>
                  <span>Due: {formatDate(project.dueDate)}</span>
                  <span>{project.members?.length || 0} members</span>
                </div>
                <Link className={styles.detailsLink} href={`/projects/${project._id}`}>
                  View details
                </Link>
              </div>
              {canManageProjects ? (
                <label className={styles.statusControl}>
                  Status
                  <select
                    value={project.status}
                    disabled={updatingProjectId === project._id || Boolean(project.archivedAt)}
                    onChange={(event) =>
                      onStatusChange(project._id, event.target.value as ProjectStatus)
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className={styles.statusBadge}>{project.status}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

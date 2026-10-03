"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectList } from "@/components/ProjectList";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { inviteUser } from "@/lib/authApi";
import { createProject, getProjects, updateProjectStatus } from "@/lib/projectsApi";
import type { InvitationRole } from "@/types/auth";
import type { CreateProjectInput, Project, ProjectStatus } from "@/types/project";
import styles from "./page.module.css";

function Dashboard() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<InvitationRole>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [updatingProjectId, setUpdatingProjectId] = useState("");

  const fetchProjects = useCallback(async () => {
    return getProjects();
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

  const handleCreateProject = async (input: CreateProjectInput) => {
    setIsSubmitting(true);
    setMessage("");

    try {
      await createProject(input);
      setIsLoading(true);
      setProjects(await fetchProjects());
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create project");
      return false;
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleInviteUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsInviting(true);
    setInviteMessage("");

    try {
      const result = await inviteUser({
        email: inviteEmail,
        name: inviteName,
        role: inviteRole,
      });

      setInviteEmail("");
      setInviteName("");
      setInviteRole("member");
      setInviteUrl(result.data?.inviteUrl || "");
      setInviteMessage(result.message || "Invitation created");
    } catch (error) {
      setInviteUrl("");
      setInviteMessage(error instanceof Error ? error.message : "Could not send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteMessage("Invite link copied.");
    } catch {
      setInviteMessage("Invite link is ready. Select and copy it manually.");
    }
  };

  const handleUpdateProjectStatus = async (projectId: string, status: ProjectStatus) => {
    setUpdatingProjectId(projectId);
    setMessage("");

    try {
      const updatedProject = await updateProjectStatus(projectId, status);

      if (updatedProject) {
        setProjects((currentProjects) =>
          currentProjects.map((project) =>
            project._id === updatedProject._id ? updatedProject : project,
          ),
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update project status");
    } finally {
      setUpdatingProjectId("");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth/login");
  };

  const canManageProjects = user?.role === "admin" || user?.role === "manager";
  const canInvite = user?.role === "admin" || user?.role === "manager";
  const inviteRoleOptions: { label: string; value: InvitationRole }[] =
    user?.role === "admin"
      ? [
          { label: "Manager", value: "manager" },
          { label: "Member", value: "member" },
        ]
      : [{ label: "Member", value: "member" }];

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <p className={styles.eyebrow}>Codex Tracker System</p>
        <h1>Project Tracker</h1>
        <p>Manage secured team projects with role-based access, dates, members, and archive control.</p>
        <div className={styles.userBar}>
          <span>
            {user?.name} · {user?.role}
          </span>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      <section className={styles.content}>
        {canManageProjects ? (
          <ProjectForm
            errorMessage={message}
            isSubmitting={isSubmitting}
            onSubmit={handleCreateProject}
          />
        ) : (
          <section className={styles.memberNotice}>
            <h2>Assigned workspace</h2>
            <p>You can view projects where you are listed as a member.</p>
            {message ? <p className={styles.message}>{message}</p> : null}
          </section>
        )}
        <ProjectList
          canManageProjects={canManageProjects}
          isLoading={isLoading}
          onStatusChange={handleUpdateProjectStatus}
          projects={projects}
          updatingProjectId={updatingProjectId}
        />
      </section>

      {canInvite ? (
        <section className={styles.adminPanel}>
          <h2>Invite user</h2>
          <form className={styles.form} onSubmit={handleInviteUser}>
            <label>
              Name
              <input
                required
                value={inviteName}
                onChange={(event) => setInviteName(event.target.value)}
                placeholder="Invited user name"
              />
            </label>
            <label>
              Email
              <input
                required
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="user@example.com"
              />
            </label>
            <label>
              Role
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as InvitationRole)}
              >
                {inviteRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" disabled={isInviting}>
              {isInviting ? "Creating invite..." : "Create invite link"}
            </button>
            {inviteUrl ? (
              <div className={styles.inviteResult}>
                <input readOnly value={inviteUrl} aria-label="Invite link" />
                <button type="button" onClick={handleCopyInviteLink}>
                  Copy link
                </button>
              </div>
            ) : null}
            {inviteMessage ? <p className={styles.message}>{inviteMessage}</p> : null}
          </form>
        </section>
      ) : null}
    </main>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

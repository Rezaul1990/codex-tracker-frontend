"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/AuthProvider";
import { ProjectForm } from "@/components/ProjectForm";
import { ProjectList } from "@/components/ProjectList";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { inviteUser } from "@/lib/authApi";
import { getDashboardSummary } from "@/lib/dashboardApi";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notificationsApi";
import { createProject, getProjects, updateProjectStatus } from "@/lib/projectsApi";
import type { InvitationRole } from "@/types/auth";
import type { DashboardSummary } from "@/types/dashboard";
import type { Notification } from "@/types/notification";
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
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [dashboardMessage, setDashboardMessage] = useState("");
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);

  const fetchProjects = useCallback(async () => {
    return getProjects(showArchivedProjects);
  }, [showArchivedProjects]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialProjects = async () => {
      try {
        const [savedProjects, summary, notificationResult] = await Promise.all([
          fetchProjects(),
          getDashboardSummary(),
          getNotifications(),
        ]);

        if (isMounted) {
          setProjects(savedProjects);
          setDashboardSummary(summary || null);
          setNotifications(notificationResult.notifications);
          setUnreadCount(notificationResult.unreadCount);
        }
      } catch (error) {
        if (isMounted) {
          setMessage(error instanceof Error ? error.message : "Could not load projects");
          setDashboardMessage(error instanceof Error ? error.message : "Could not load dashboard");
          setNotificationMessage(
            error instanceof Error ? error.message : "Could not load notifications",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingDashboard(false);
          setIsLoadingNotifications(false);
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
      setDashboardSummary((await getDashboardSummary()) || null);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create project");
      return false;
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleMarkNotificationRead = async (notification: Notification) => {
    if (notification.isRead) {
      return;
    }

    try {
      const updated = await markNotificationRead(notification._id);
      if (updated) {
        setNotifications((currentNotifications) =>
          currentNotifications.map((currentNotification) =>
            currentNotification._id === updated._id ? updated : currentNotification,
          ),
        );
      }
      setUnreadCount((currentCount) => Math.max(0, currentCount - 1));
    } catch (error) {
      setNotificationMessage(error instanceof Error ? error.message : "Could not update notification");
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (error) {
      setNotificationMessage(error instanceof Error ? error.message : "Could not update notifications");
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

      <section className={styles.dashboardGrid}>
        <section className={styles.detailPanel}>
          <div className={styles.listHeader}>
            <h2>Dashboard</h2>
            <span>{isLoadingDashboard ? "..." : dashboardSummary?.totalAccessibleProjects || 0}</span>
          </div>
          {isLoadingDashboard ? (
            <p className={styles.empty}>Loading dashboard...</p>
          ) : dashboardMessage ? (
            <p className={styles.message}>{dashboardMessage}</p>
          ) : dashboardSummary ? (
            <div className={styles.metricGrid}>
              {[
                ["Projects", dashboardSummary.totalAccessibleProjects],
                ["Active", dashboardSummary.activeProjects],
                ["Completed", dashboardSummary.completedProjects],
                ["Tasks", dashboardSummary.totalRelevantTasks],
                ["Todo", dashboardSummary.todoTasks],
                ["In progress", dashboardSummary.inProgressTasks],
                ["Done", dashboardSummary.completedTasks],
                ["Overdue", dashboardSummary.overdueTasks],
                ["Assigned to me", dashboardSummary.assignedToMeTasks],
                ["Due soon", dashboardSummary.upcomingDueTasks],
              ].map(([label, value]) => (
                <div className={styles.metricCard} key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.empty}>No dashboard data yet.</p>
          )}
        </section>

        <section className={styles.detailPanel}>
          <div className={styles.listHeader}>
            <h2>Notifications</h2>
            <span>{unreadCount}</span>
          </div>
          {isLoadingNotifications ? (
            <p className={styles.empty}>Loading notifications...</p>
          ) : notifications.length ? (
            <>
              <button
                type="button"
                className={styles.secondaryAction}
                disabled={unreadCount === 0}
                onClick={handleMarkAllNotificationsRead}
              >
                Mark all read
              </button>
              <ul className={styles.notificationList}>
                {notifications.map((notification) => (
                  <li
                    key={notification._id}
                    className={notification.isRead ? "" : styles.unreadNotification}
                  >
                    <button type="button" onClick={() => handleMarkNotificationRead(notification)}>
                      <strong>{notification.title}</strong>
                      <span>{notification.message}</span>
                    </button>
                    {notification.project?._id ? (
                      <button
                        type="button"
                        className={styles.secondaryAction}
                        onClick={() => router.push(`/projects/${notification.project?._id}`)}
                      >
                        Open
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.empty}>No notifications yet.</p>
          )}
          {notificationMessage ? <p className={styles.message}>{notificationMessage}</p> : null}
        </section>
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
        <div className={styles.projectListColumn}>
          <section className={styles.filterBand}>
            <label>
              <input
                type="checkbox"
                checked={showArchivedProjects}
                onChange={(event) => setShowArchivedProjects(event.target.checked)}
              />
              Show archived projects
            </label>
          </section>
          <ProjectList
            canManageProjects={canManageProjects}
            isLoading={isLoading}
            onStatusChange={handleUpdateProjectStatus}
            projects={projects}
            updatingProjectId={updatingProjectId}
          />
        </div>
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

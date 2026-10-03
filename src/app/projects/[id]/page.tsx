"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/components/AuthProvider";
import {
  addProjectMember,
  archiveProject,
  getProject,
  removeProjectMember,
  updateProject,
} from "@/lib/projectsApi";
import {
  archiveTask,
  createTask,
  getProjectTasks,
  updateTask,
  updateTaskStatus,
} from "@/lib/tasksApi";
import {
  createTaskComment,
  getAttachmentUrl,
  getProjectActivities,
  getProjectAttachments,
  getTaskAttachments,
  getTaskComments,
  removeAttachment,
  uploadProjectAttachment,
  uploadTaskAttachment,
} from "@/lib/collaborationApi";
import { getUsers } from "@/lib/authApi";
import type { AuthUser } from "@/types/auth";
import type { Activity, Attachment, Comment } from "@/types/collaboration";
import type { Project, ProjectStatus, ProjectUser } from "@/types/project";
import type { Task, TaskPriority, TaskStatus } from "@/types/task";
import styles from "../../page.module.css";

const getUserId = (user: ProjectUser) => user.id || user._id || "";

const toDateInputValue = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
};

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

function ProjectDetails() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("pending");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [availableUsers, setAvailableUsers] = useState<AuthUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskMessage, setTaskMessage] = useState("");
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskAssignee, setTaskAssignee] = useState("");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentMessage, setCommentMessage] = useState("");
  const [commentMentions, setCommentMentions] = useState<string[]>([]);
  const [projectAttachments, setProjectAttachments] = useState<Attachment[]>([]);
  const [taskAttachments, setTaskAttachments] = useState<Attachment[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [collaborationMessage, setCollaborationMessage] = useState("");
  const [isMentionPickerOpen, setIsMentionPickerOpen] = useState(false);

  const canManage = user?.role === "admin" || user?.role === "manager";

  const hydrateForm = useCallback((nextProject: Project) => {
    setProject(nextProject);
    setProjectName(nextProject.projectName);
    setDescription(nextProject.description || "");
    setStatus(nextProject.status);
    setStartDate(toDateInputValue(nextProject.startDate));
    setDueDate(toDateInputValue(nextProject.dueDate));
  }, []);

  const loadProject = useCallback(async () => {
    setIsLoading(true);
    setIsLoadingTasks(true);
    setMessage("");
    setTaskMessage("");

    try {
      const result = await getProject(projectId);

      if (result) {
        hydrateForm(result);
      }

      const [nextTasks, nextAttachments, nextActivities] = await Promise.all([
        getProjectTasks(projectId),
        getProjectAttachments(projectId),
        getProjectActivities(projectId),
      ]);

      setTasks(nextTasks);
      setProjectAttachments(nextAttachments);
      setActivities(nextActivities);
      setSelectedTaskId((currentTaskId) => currentTaskId || nextTasks[0]?._id || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load project");
    } finally {
      setIsLoading(false);
      setIsLoadingTasks(false);
    }
  }, [hydrateForm, projectId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProject();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProject]);

  useEffect(() => {
    if (!selectedTaskId) {
      const timer = window.setTimeout(() => {
        setComments([]);
        setTaskAttachments([]);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(async () => {
      try {
        const [nextComments, nextAttachments] = await Promise.all([
          getTaskComments(selectedTaskId),
          getTaskAttachments(selectedTaskId),
        ]);

        setComments(nextComments);
        setTaskAttachments(nextAttachments);
      } catch (error) {
        setCollaborationMessage(
          error instanceof Error ? error.message : "Could not load task collaboration",
        );
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedTaskId]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const result = await updateProject(projectId, {
        description,
        dueDate,
        projectName,
        startDate,
        status,
      });

      if (result) {
        hydrateForm(result);
      }

      setMessage("Project updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update project");
    } finally {
      setIsSaving(false);
    }
  };

  const openMemberPicker = async () => {
    setIsMemberPickerOpen(true);
    setIsLoadingUsers(true);
    setMessage("");

    try {
      const users = await getUsers();
      const memberIds = new Set((project?.members || []).map((member) => getUserId(member)));
      const selectableUsers = users.filter((candidate) => !memberIds.has(candidate.id));

      setAvailableUsers(selectableUsers);
      setSelectedUserId(selectableUsers[0]?.id || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleAddSelectedMember = async () => {
    if (!selectedUserId) {
      setMessage("Select a user first.");
      return;
    }

    setIsAddingMember(true);
    setMessage("");

    try {
      const result = await addProjectMember(projectId, { userId: selectedUserId });

      if (result) {
        hydrateForm(result);
      }

      setIsMemberPickerOpen(false);
      setSelectedUserId("");
      setMessage("Project member added.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add member");
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (member: ProjectUser) => {
    const memberId = getUserId(member);

    if (!memberId) {
      setMessage("Member id is missing.");
      return;
    }

    setMessage("");

    try {
      const result = await removeProjectMember(projectId, memberId);

      if (result) {
        hydrateForm(result);
      }

      setMessage("Project member removed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove member");
    }
  };

  const handleArchive = async () => {
    if (!project) {
      return;
    }

    const shouldArchive = !project.archivedAt;

    if (shouldArchive && !window.confirm("Archive this project? It will be hidden from the active list.")) {
      return;
    }

    setMessage("");

    try {
      const result = await archiveProject(projectId, shouldArchive);

      if (result) {
        hydrateForm(result);
      }

      setMessage(shouldArchive ? "Project archived." : "Project restored.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update archive state");
    }
  };

  const resetTaskForm = () => {
    setEditingTaskId("");
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("todo");
    setTaskPriority("medium");
    setTaskAssignee("");
    setTaskStartDate("");
    setTaskDueDate("");
  };

  const upsertTask = (nextTask: Task) => {
    setTasks((currentTasks) => {
      const exists = currentTasks.some((task) => task._id === nextTask._id);

      if (!exists) {
        return [nextTask, ...currentTasks];
      }

      return currentTasks.map((task) => (task._id === nextTask._id ? nextTask : task));
    });
  };

  const handleSaveTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingTask(true);
    setTaskMessage("");

    const input = {
      assignee: taskAssignee,
      description: taskDescription,
      dueDate: taskDueDate,
      priority: taskPriority,
      startDate: taskStartDate,
      status: taskStatus,
      title: taskTitle,
    };

    try {
      const wasEditing = Boolean(editingTaskId);
      const result = editingTaskId
        ? await updateTask(editingTaskId, input)
        : await createTask(projectId, input);

      if (result) {
        upsertTask(result);
        setSelectedTaskId(result._id);
      }

      resetTaskForm();
      setTaskMessage(wasEditing ? "Task updated." : "Task created.");
      await refreshActivities();
    } catch (error) {
      setTaskMessage(error instanceof Error ? error.message : "Could not save task");
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTaskId(task._id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || "");
    setTaskStatus(task.status);
    setTaskPriority(task.priority);
    setTaskAssignee(task.assignee ? getUserId(task.assignee) : "");
    setTaskStartDate(toDateInputValue(task.startDate));
    setTaskDueDate(toDateInputValue(task.dueDate));
    setTaskMessage("");
  };

  const handleUpdateTaskStatus = async (taskId: string, nextStatus: TaskStatus) => {
    setTaskMessage("");

    try {
      const result = await updateTaskStatus(taskId, nextStatus);

      if (result) {
        upsertTask(result);
      }
      await refreshActivities();
    } catch (error) {
      setTaskMessage(error instanceof Error ? error.message : "Could not update task status");
    }
  };

  const handleArchiveTask = async (task: Task) => {
    if (!window.confirm("Archive this task? It will be hidden from the active task list.")) {
      return;
    }

    setTaskMessage("");

    try {
      await archiveTask(task._id, true);
      setTasks((currentTasks) => currentTasks.filter((currentTask) => currentTask._id !== task._id));
      if (selectedTaskId === task._id) {
        setSelectedTaskId("");
      }
      setTaskMessage("Task archived.");
      await refreshActivities();
    } catch (error) {
      setTaskMessage(error instanceof Error ? error.message : "Could not archive task");
    }
  };

  const refreshActivities = async () => {
    setActivities(await getProjectActivities(projectId));
  };

  const handleCreateComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedTaskId) {
      return;
    }

    setCollaborationMessage("");

    try {
      const comment = await createTaskComment(selectedTaskId, commentMessage, commentMentions);

      if (comment) {
        setComments((currentComments) => [...currentComments, comment]);
      }

      setCommentMessage("");
      setCommentMentions([]);
      await refreshActivities();
    } catch (error) {
      setCollaborationMessage(error instanceof Error ? error.message : "Could not add comment");
    }
  };

  const handleSelectMention = (member: ProjectUser) => {
    const memberId = getUserId(member);

    if (!memberId) {
      return;
    }

    setCommentMentions((currentMentions) =>
      currentMentions.includes(memberId) ? currentMentions : [...currentMentions, memberId],
    );

    setCommentMessage((currentMessage) => {
      const mentionText = `@${member.name}`;

      if (currentMessage.includes(mentionText)) {
        return currentMessage;
      }

      return `${currentMessage}${currentMessage ? " " : ""}${mentionText} `;
    });
    setIsMentionPickerOpen(false);
  };

  const handleProjectFileChange = async (event: FormEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    setCollaborationMessage("");

    try {
      const attachment = await uploadProjectAttachment(projectId, file);

      if (attachment) {
        setProjectAttachments((currentAttachments) => [attachment, ...currentAttachments]);
      }

      await refreshActivities();
    } catch (error) {
      setCollaborationMessage(
        error instanceof Error ? error.message : "Could not upload project attachment",
      );
    }
  };

  const handleTaskFileChange = async (event: FormEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";

    if (!file || !selectedTaskId) {
      return;
    }

    setCollaborationMessage("");

    try {
      const attachment = await uploadTaskAttachment(selectedTaskId, file);

      if (attachment) {
        setTaskAttachments((currentAttachments) => [attachment, ...currentAttachments]);
      }

      await refreshActivities();
    } catch (error) {
      setCollaborationMessage(
        error instanceof Error ? error.message : "Could not upload task attachment",
      );
    }
  };

  const handleRemoveAttachment = async (attachment: Attachment) => {
    setCollaborationMessage("");

    try {
      await removeAttachment(attachment._id);

      if (attachment.entityType === "project") {
        setProjectAttachments((currentAttachments) =>
          currentAttachments.filter((currentAttachment) => currentAttachment._id !== attachment._id),
        );
      } else {
        setTaskAttachments((currentAttachments) =>
          currentAttachments.filter((currentAttachment) => currentAttachment._id !== attachment._id),
        );
      }
    } catch (error) {
      setCollaborationMessage(error instanceof Error ? error.message : "Could not remove attachment");
    }
  };

  if (isLoading) {
    return (
      <main className={styles.page}>
        <section className={styles.authPanel}>
          <h1>Loading project...</h1>
        </section>
      </main>
    );
  }

  if (!project) {
    return (
      <main className={styles.page}>
        <section className={styles.authPanel}>
          <h1>Project unavailable</h1>
          <p className={styles.message}>{message || "This project could not be loaded."}</p>
          <Link href="/">Back to dashboard</Link>
        </section>
      </main>
    );
  }

  const creatorId = project.createdBy ? getUserId(project.createdBy) : "";
  const memberOptions = project.members || [];
  const selectedTask = tasks.find((task) => task._id === selectedTaskId) || null;
  const canUpdateTaskStatus = (task: Task) =>
    canManage || (task.assignee ? getUserId(task.assignee) === user?.id : false);
  const formatFileSize = (size: number) => `${Math.max(1, Math.round(size / 1024))} KB`;
  const formatActivityAction = (action: string) =>
    action
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  const getActivityContext = (activity: Activity) => {
    const metadata = activity.metadata || {};
    const details = [];

    if (activity.task?.title || metadata.taskTitle) {
      details.push(`Task: ${activity.task?.title || metadata.taskTitle}`);
    }

    if (metadata.fileName) {
      details.push(`File: ${metadata.fileName}`);
    }

    if (metadata.memberName || metadata.memberEmail) {
      details.push(`Member: ${metadata.memberName || metadata.memberEmail}`);
    }

    if (metadata.from || metadata.to) {
      details.push(`Changed: ${metadata.from || "none"} to ${metadata.to || "none"}`);
    }

    return details;
  };
  const isImageAttachment = (attachment: Attachment) => attachment.mimeType.startsWith("image/");

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <p className={styles.eyebrow}>Project workspace</p>
        <h1>{project.projectName}</h1>
        <p>{project.description || "No description provided."}</p>
        <div className={styles.userBar}>
          <Link href="/">Back to dashboard</Link>
          <button type="button" onClick={() => router.refresh()}>
            Refresh
          </button>
        </div>
      </section>

      <section className={styles.detailGrid}>
        <section className={styles.detailPanel}>
          <div className={styles.projectTitleRow}>
            <h2>Project details</h2>
            {project.archivedAt ? <span className={styles.archiveBadge}>Archived</span> : null}
          </div>
          <dl className={styles.detailList}>
            <div>
              <dt>Status</dt>
              <dd>{project.status}</dd>
            </div>
            <div>
              <dt>Start date</dt>
              <dd>{formatDate(project.startDate)}</dd>
            </div>
            <div>
              <dt>Due date</dt>
              <dd>{formatDate(project.dueDate)}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{project.createdBy?.name || "Unknown"}</dd>
            </div>
          </dl>
        </section>

        {canManage ? (
          <form className={styles.form} onSubmit={handleSave}>
            <h2>Edit project</h2>
            <label>
              Project name
              <input
                required
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
              />
            </label>
            <label>
              Description
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <label>
              Status
              <select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
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
            <button type="submit" disabled={isSaving || Boolean(project.archivedAt)}>
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleArchive}>
              {project.archivedAt ? "Restore project" : "Archive project"}
            </button>
          </form>
        ) : null}

        <section className={styles.detailPanel}>
          <div className={styles.listHeader}>
            <h2>Members</h2>
            <span>{project.members?.length || 0}</span>
          </div>

          {canManage ? (
            <button type="button" className={styles.fullButton} onClick={openMemberPicker}>
              Add member
            </button>
          ) : null}

          {project.members?.length ? (
            <ul className={styles.memberList}>
              {project.members.map((member) => {
                const memberId = getUserId(member);
                const isCreator = memberId === creatorId;

                return (
                  <li key={memberId || member.email}>
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.email} · {member.role}{isCreator ? " · creator" : ""}</span>
                    </div>
                    {canManage && !isCreator ? (
                      <button type="button" onClick={() => handleRemoveMember(member)}>
                        Remove
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.empty}>No project members yet.</p>
          )}

          {message ? <p className={styles.message}>{message}</p> : null}
        </section>
      </section>

      <section className={styles.taskWorkspace}>
        <div className={styles.listHeader}>
          <h2>Tasks</h2>
          <span>{tasks.length}</span>
        </div>

        <div className={`${styles.taskGrid} ${!canManage ? styles.taskGridFull : ""}`}>
          {canManage ? (
            <form className={styles.form} onSubmit={handleSaveTask}>
              <h2>{editingTaskId ? "Edit task" : "Create task"}</h2>
              <label>
                Title
                <input
                  required
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Prepare dashboard UI"
                />
              </label>
              <label>
                Description
                <textarea
                  rows={3}
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                  placeholder="Task details"
                />
              </label>
              <label>
                Status
                <select
                  value={taskStatus}
                  onChange={(event) => setTaskStatus(event.target.value as TaskStatus)}
                >
                  <option value="todo">Todo</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </label>
              <label>
                Priority
                <select
                  value={taskPriority}
                  onChange={(event) => setTaskPriority(event.target.value as TaskPriority)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
              <label>
                Assignee
                <select
                  value={taskAssignee}
                  onChange={(event) => setTaskAssignee(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {memberOptions.map((member) => (
                    <option key={getUserId(member)} value={getUserId(member)}>
                      {member.name} · {member.role}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Start date
                <input
                  type="date"
                  value={taskStartDate}
                  onChange={(event) => setTaskStartDate(event.target.value)}
                />
              </label>
              <label>
                Due date
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(event) => setTaskDueDate(event.target.value)}
                />
              </label>
              <button type="submit" disabled={isSavingTask || Boolean(project.archivedAt)}>
                {isSavingTask ? "Saving..." : editingTaskId ? "Save task" : "Create task"}
              </button>
              {editingTaskId ? (
                <button type="button" className={styles.secondaryButton} onClick={resetTaskForm}>
                  Cancel edit
                </button>
              ) : null}
            </form>
          ) : null}

          <section
            className={`${styles.detailPanel} ${styles.taskTablePanel} ${
              !canManage ? styles.fullWidthPanel : ""
            }`}
          >
            {isLoadingTasks ? (
              <p className={styles.empty}>Loading tasks...</p>
            ) : tasks.length === 0 ? (
              <p className={styles.empty}>No active tasks yet.</p>
            ) : (
              <div className={styles.taskTableWrap}>
                <table className={styles.taskTable}>
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Assignee</th>
                      <th>Dates</th>
                      {canManage ? <th>Actions</th> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id}>
                        <td>
                          <strong>{task.title}</strong>
                          <span>{task.description || "No description."}</span>
                          <button type="button" onClick={() => setSelectedTaskId(task._id)}>
                            Open
                          </button>
                        </td>
                        <td>
                          {canUpdateTaskStatus(task) ? (
                            <select
                              value={task.status}
                              onChange={(event) =>
                                handleUpdateTaskStatus(task._id, event.target.value as TaskStatus)
                              }
                            >
                              <option value="todo">Todo</option>
                              <option value="in-progress">In progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          ) : (
                            <span className={styles.statusBadge}>{task.status}</span>
                          )}
                        </td>
                        <td>
                          <span className={styles.statusBadge}>{task.priority}</span>
                        </td>
                        <td>{task.assignee?.name || "Unassigned"}</td>
                        <td>
                          <span>Start: {formatDate(task.startDate)}</span>
                          <span>Due: {formatDate(task.dueDate)}</span>
                        </td>
                        {canManage ? (
                          <td>
                            <button type="button" onClick={() => handleEditTask(task)}>
                              Edit
                            </button>
                            <button type="button" onClick={() => handleArchiveTask(task)}>
                              Archive
                            </button>
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {taskMessage ? <p className={styles.message}>{taskMessage}</p> : null}
          </section>
        </div>
      </section>

      <section className={styles.collaborationGrid}>
        <section className={styles.detailPanel}>
          <div className={styles.listHeader}>
            <h2>Project files</h2>
            <span>{projectAttachments.length}</span>
          </div>
          <label className={styles.uploadControl}>
            Upload file
            <input type="file" onChange={handleProjectFileChange} />
          </label>
          {projectAttachments.length ? (
            <ul className={styles.attachmentList}>
              {projectAttachments.map((attachment) => (
                <li key={attachment._id}>
                  {isImageAttachment(attachment) ? (
                    <img
                      className={styles.attachmentPreview}
                      src={getAttachmentUrl(attachment.url)}
                      alt={attachment.fileName}
                    />
                  ) : null}
                  <div>
                    <a href={getAttachmentUrl(attachment.url)} target="_blank" rel="noreferrer">
                      {attachment.fileName}
                    </a>
                    <span>
                      {formatFileSize(attachment.size)} · {attachment.uploadedBy?.name || "Unknown"}
                    </span>
                  </div>
                  <button type="button" onClick={() => handleRemoveAttachment(attachment)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No project files uploaded.</p>
          )}
        </section>

        <section className={styles.detailPanel}>
          <div className={styles.listHeader}>
            <h2>Activity</h2>
            <span>{activities.length}</span>
          </div>
          {activities.length ? (
            <ul className={styles.activityList}>
              {activities.map((activity) => (
                <li key={activity._id}>
                  <strong>{formatActivityAction(activity.action)}</strong>
                  <span>
                    {activity.actor?.name || "Unknown"} · {formatDate(activity.createdAt)}
                  </span>
                  {getActivityContext(activity).map((detail) => (
                    <span key={detail}>{detail}</span>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>No activity yet.</p>
          )}
        </section>

        <section className={styles.detailPanel}>
          <div className={styles.listHeader}>
            <h2>Task comments</h2>
            <span>{comments.length}</span>
          </div>
          {selectedTask ? (
            <>
              <p className={styles.contextLine}>{selectedTask.title}</p>
              <form className={styles.inlineForm} onSubmit={handleCreateComment}>
                <input
                  required
                  value={commentMessage}
                  onChange={(event) => setCommentMessage(event.target.value)}
                  placeholder="Write a comment"
                />
                <button type="button" onClick={() => setIsMentionPickerOpen(true)}>
                  Tag user
                </button>
                <button type="submit">Send</button>
              </form>
              {commentMentions.length ? (
                <p className={styles.contextLine}>
                  Tagged:{" "}
                  {memberOptions
                    .filter((member) => commentMentions.includes(getUserId(member)))
                    .map((member) => member.name)
                    .join(", ")}
                </p>
              ) : null}
              {comments.length ? (
                <ul className={styles.commentList}>
                  {comments.map((comment) => (
                    <li key={comment._id}>
                      <strong>{comment.author?.name || "Unknown"}</strong>
                      <p>{comment.message}</p>
                      {comment.mentions?.length ? (
                        <span>
                          Tagged: {comment.mentions.map((mention) => mention.name).join(", ")}
                        </span>
                      ) : null}
                      <span>{formatDate(comment.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>No comments for this task.</p>
              )}
            </>
          ) : (
            <p className={styles.empty}>Open a task to view comments.</p>
          )}
        </section>

        <section className={styles.detailPanel}>
          <div className={styles.listHeader}>
            <h2>Task files</h2>
            <span>{taskAttachments.length}</span>
          </div>
          {selectedTask ? (
            <>
              <label className={styles.uploadControl}>
                Upload file
                <input type="file" onChange={handleTaskFileChange} />
              </label>
              {taskAttachments.length ? (
                <ul className={styles.attachmentList}>
                  {taskAttachments.map((attachment) => (
                    <li key={attachment._id}>
                      {isImageAttachment(attachment) ? (
                        <img
                          className={styles.attachmentPreview}
                          src={getAttachmentUrl(attachment.url)}
                          alt={attachment.fileName}
                        />
                      ) : null}
                      <div>
                        <a href={getAttachmentUrl(attachment.url)} target="_blank" rel="noreferrer">
                          {attachment.fileName}
                        </a>
                        <span>
                          {formatFileSize(attachment.size)} · {attachment.uploadedBy?.name || "Unknown"}
                        </span>
                      </div>
                      <button type="button" onClick={() => handleRemoveAttachment(attachment)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.empty}>No task files uploaded.</p>
              )}
            </>
          ) : (
            <p className={styles.empty}>Open a task to view files.</p>
          )}
        </section>
      </section>

      {collaborationMessage ? (
        <p className={`${styles.message} ${styles.globalMessage}`}>{collaborationMessage}</p>
      ) : null}

      {isMentionPickerOpen ? (
        <div className={styles.modalBackdrop}>
          <section className={styles.modalPanel}>
            <div className={styles.listHeader}>
              <h2>Tag user</h2>
              <button
                type="button"
                className={styles.iconTextButton}
                onClick={() => setIsMentionPickerOpen(false)}
              >
                Close
              </button>
            </div>
            {memberOptions.length ? (
              <ul className={styles.userPickerList}>
                {memberOptions.map((member) => (
                  <li key={getUserId(member)}>
                    <button
                      type="button"
                      className={styles.pickerButton}
                      onClick={() => handleSelectMention(member)}
                    >
                      <span>
                        <strong>{member.name}</strong>
                        {member.email} · {member.role}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.empty}>No project members available.</p>
            )}
          </section>
        </div>
      ) : null}

      {isMemberPickerOpen ? (
        <div className={styles.modalBackdrop}>
          <section className={styles.modalPanel}>
            <div className={styles.listHeader}>
              <h2>Select member</h2>
              <button
                type="button"
                className={styles.iconTextButton}
                onClick={() => setIsMemberPickerOpen(false)}
              >
                Close
              </button>
            </div>

            {isLoadingUsers ? (
              <p className={styles.empty}>Loading users...</p>
            ) : availableUsers.length === 0 ? (
              <p className={styles.empty}>No available users to add.</p>
            ) : (
              <ul className={styles.userPickerList}>
                {availableUsers.map((candidate) => (
                  <li key={candidate.id}>
                    <label>
                      <input
                        type="radio"
                        name="selectedUser"
                        checked={selectedUserId === candidate.id}
                        onChange={() => setSelectedUserId(candidate.id)}
                      />
                      <span>
                        <strong>{candidate.name}</strong>
                        {candidate.email} · {candidate.role}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={() => setIsMemberPickerOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAddingMember || !selectedUserId}
                onClick={handleAddSelectedMember}
              >
                {isAddingMember ? "Adding..." : "OK"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default function ProjectDetailsPage() {
  return (
    <ProtectedRoute>
      <ProjectDetails />
    </ProtectedRoute>
  );
}

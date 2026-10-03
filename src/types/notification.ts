import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { ProjectUser } from "@/types/project";

export type NotificationType =
  | "project_member_added"
  | "task_assigned"
  | "task_reassigned"
  | "task_status_changed"
  | "comment_added";

export type Notification = {
  _id: string;
  actor?: ProjectUser | null;
  createdAt?: string;
  isRead: boolean;
  message: string;
  project?: Pick<Project, "_id" | "projectName" | "status" | "archivedAt"> | null;
  readAt?: string | null;
  task?: Pick<Task, "_id" | "title" | "status" | "priority" | "archivedAt"> | null;
  title: string;
  type: NotificationType;
  updatedAt?: string;
};

export type NotificationResponse = {
  notifications: Notification[];
  unreadCount: number;
};

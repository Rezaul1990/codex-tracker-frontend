import type { AuthUser } from "@/types/auth";
import type { Task } from "@/types/task";

export type Comment = {
  _id: string;
  author: AuthUser;
  createdAt: string;
  message: string;
  mentions?: AuthUser[];
  task: string;
};

export type Attachment = {
  _id: string;
  createdAt: string;
  entityId: string;
  entityType: "project" | "task";
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy: AuthUser;
  url: string;
};

export type Activity = {
  _id: string;
  action: string;
  actor: AuthUser;
  createdAt: string;
  metadata?: Record<string, string>;
  task?: Pick<Task, "_id" | "title" | "status"> | null;
};

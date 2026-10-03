import type { ProjectUser } from "@/types/project";

export type TaskStatus = "todo" | "in-progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  _id: string;
  archivedAt?: string | null;
  assignee?: ProjectUser | null;
  createdAt?: string;
  createdBy?: ProjectUser;
  description: string;
  dueDate?: string | null;
  priority: TaskPriority;
  project: string | { _id: string; projectName: string };
  startDate?: string | null;
  status: TaskStatus;
  title: string;
  updatedAt?: string;
};

export type CreateTaskInput = {
  assignee?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  startDate?: string;
  status?: TaskStatus;
  title: string;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export type TaskSearchFilters = {
  archived?: "false" | "true" | "only";
  assignee?: string;
  dueFrom?: string;
  dueTo?: string;
  limit?: number;
  page?: number;
  priority?: "" | TaskPriority;
  search?: string;
  sort?: string;
  status?: "" | TaskStatus;
};

export type PaginatedTasks = {
  data: Task[];
  meta?: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

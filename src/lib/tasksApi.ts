import { apiRequest } from "@/lib/apiClient";
import type {
  CreateTaskInput,
  PaginatedTasks,
  Task,
  TaskSearchFilters,
  TaskStatus,
  UpdateTaskInput,
} from "@/types/task";

const buildTaskQuery = (filters: TaskSearchFilters = {}) => {
  const query = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });

  return query.toString();
};

export const getProjectTasks = async (
  projectId: string,
  includeArchivedOrFilters: boolean | TaskSearchFilters = false,
) => {
  const filters =
    typeof includeArchivedOrFilters === "boolean"
      ? ({ archived: includeArchivedOrFilters ? "true" : "false" } satisfies TaskSearchFilters)
      : includeArchivedOrFilters;
  const query = buildTaskQuery(filters);
  const result = await apiRequest<Task[]>(`/api/projects/${projectId}/tasks${query ? `?${query}` : ""}`);

  return {
    data: result.data || [],
    meta: (result as PaginatedTasks).meta,
  } satisfies PaginatedTasks;
};

export const createTask = async (projectId: string, input: CreateTaskInput) => {
  const result = await apiRequest<Task>(`/api/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return result.data;
};

export const updateTask = async (taskId: string, input: UpdateTaskInput) => {
  const result = await apiRequest<Task>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return result.data;
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
  const result = await apiRequest<Task>(`/api/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return result.data;
};

export const updateTaskAssignee = async (taskId: string, assignee: string) => {
  const result = await apiRequest<Task>(`/api/tasks/${taskId}/assignee`, {
    method: "PATCH",
    body: JSON.stringify({ assignee }),
  });

  return result.data;
};

export const archiveTask = async (taskId: string, archived = true) => {
  const result = await apiRequest<Task>(`/api/tasks/${taskId}/archive`, {
    method: "PATCH",
    body: JSON.stringify({ archived }),
  });

  return result.data;
};

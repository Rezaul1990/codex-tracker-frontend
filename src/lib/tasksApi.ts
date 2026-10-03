import { apiRequest } from "@/lib/apiClient";
import type { CreateTaskInput, Task, TaskStatus, UpdateTaskInput } from "@/types/task";

export const getProjectTasks = async (projectId: string, includeArchived = false) => {
  const result = await apiRequest<Task[]>(
    includeArchived
      ? `/api/projects/${projectId}/tasks?archived=true`
      : `/api/projects/${projectId}/tasks`,
  );

  return result.data || [];
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

import { apiRequest } from "@/lib/apiClient";
import type {
  CreateProjectInput,
  Project,
  ProjectStatus,
  UpdateProjectInput,
} from "@/types/project";

export const getProjects = async (includeArchived = false) => {
  const result = await apiRequest<Project[]>(
    includeArchived ? "/api/projects?archived=true" : "/api/projects",
  );

  return result.data || [];
};

export const getProject = async (projectId: string) => {
  const result = await apiRequest<Project>(`/api/projects/${projectId}`);

  return result.data;
};

export const createProject = async (input: CreateProjectInput) => {
  const result = await apiRequest<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });

  return result.data;
};

export const updateProject = async (projectId: string, input: UpdateProjectInput) => {
  const result = await apiRequest<Project>(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });

  return result.data;
};

export const updateProjectStatus = async (projectId: string, status: ProjectStatus) => {
  const result = await apiRequest<Project>(`/api/projects/${projectId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

  return result.data;
};

export const addProjectMember = async (
  projectId: string,
  input: { email?: string; userId?: string },
) => {
  const result = await apiRequest<Project>(`/api/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return result.data;
};

export const removeProjectMember = async (projectId: string, userId: string) => {
  const result = await apiRequest<Project>(`/api/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
  });

  return result.data;
};

export const archiveProject = async (projectId: string, archived = true) => {
  const result = await apiRequest<Project>(`/api/projects/${projectId}/archive`, {
    method: "PATCH",
    body: JSON.stringify({ archived }),
  });

  return result.data;
};

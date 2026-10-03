import { apiRequest } from "@/lib/apiClient";
import type { Activity, Attachment, Comment } from "@/types/collaboration";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

const uploadFile = async (path: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}${path}`, {
    body: formData,
    credentials: "include",
    method: "POST",
  });
  const result = (await response.json()) as {
    data?: Attachment;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(result.message || "Upload failed");
  }

  return result.data;
};

export const getTaskComments = async (taskId: string) => {
  const result = await apiRequest<Comment[]>(`/api/tasks/${taskId}/comments`);

  return result.data || [];
};

export const createTaskComment = async (taskId: string, message: string, mentions: string[] = []) => {
  const result = await apiRequest<Comment>(`/api/tasks/${taskId}/comments`, {
    body: JSON.stringify({ mentions, message }),
    method: "POST",
  });

  return result.data;
};

export const getProjectAttachments = async (projectId: string) => {
  const result = await apiRequest<Attachment[]>(`/api/projects/${projectId}/attachments`);

  return result.data || [];
};

export const uploadProjectAttachment = async (projectId: string, file: File) =>
  uploadFile(`/api/projects/${projectId}/attachments`, file);

export const getTaskAttachments = async (taskId: string) => {
  const result = await apiRequest<Attachment[]>(`/api/tasks/${taskId}/attachments`);

  return result.data || [];
};

export const uploadTaskAttachment = async (taskId: string, file: File) =>
  uploadFile(`/api/tasks/${taskId}/attachments`, file);

export const removeAttachment = async (attachmentId: string) =>
  apiRequest(`/api/attachments/${attachmentId}`, {
    method: "DELETE",
  });

export const getProjectActivities = async (projectId: string) => {
  const result = await apiRequest<Activity[]>(`/api/projects/${projectId}/activities`);

  return result.data || [];
};

export const getAttachmentUrl = (url: string) =>
  url.startsWith("http") ? url : `${API_URL}${url}`;

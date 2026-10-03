import { apiRequest } from "@/lib/apiClient";
import type { AuthUser, Invitation, InvitationRole } from "@/types/auth";

export const login = async (input: { email: string; password: string }) =>
  apiRequest<AuthUser>("/api/auth/login", {
    body: JSON.stringify(input),
    method: "POST",
  });

export const logout = async () =>
  apiRequest<never>("/api/auth/logout", {
    method: "POST",
  });

export const refreshAuth = async () =>
  apiRequest<AuthUser>("/api/auth/refresh", {
    method: "POST",
  });

export const getCurrentUser = async () => apiRequest<AuthUser>("/api/auth/me");

export const getUsers = async () => {
  const result = await apiRequest<AuthUser[]>("/api/auth/users");

  return result.data || [];
};

export const inviteUser = async (input: { email: string; name?: string; role: InvitationRole }) =>
  apiRequest<Invitation>("/api/auth/invitations", {
    body: JSON.stringify(input),
    method: "POST",
  });

export const acceptInvitation = async (input: {
  password: string;
  token: string;
}) =>
  apiRequest<AuthUser>("/api/auth/invitations/accept", {
    body: JSON.stringify(input),
    method: "POST",
  });

export const verifyEmail = async (token: string) =>
  apiRequest<AuthUser>("/api/auth/verify-email", {
    body: JSON.stringify({ token }),
    method: "POST",
  });

export const resendVerification = async (email: string) =>
  apiRequest("/api/auth/resend-verification", {
    body: JSON.stringify({ email }),
    method: "POST",
  });

export const forgotPassword = async (email: string) =>
  apiRequest("/api/auth/forgot-password", {
    body: JSON.stringify({ email }),
    method: "POST",
  });

export const resetPassword = async (input: { password: string; token: string }) =>
  apiRequest("/api/auth/reset-password", {
    body: JSON.stringify(input),
    method: "POST",
  });

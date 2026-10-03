export type UserRole = "admin" | "manager" | "member";

export type AuthUser = {
  email: string;
  emailVerified: boolean;
  id: string;
  name: string;
  role: UserRole;
};

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export type InvitationRole = Exclude<UserRole, "admin">;

export type Invitation = {
  email: string;
  expiresAt: string;
  id: string;
  inviteUrl: string;
  name: string;
  role: InvitationRole;
  token: string;
};

export type ProjectStatus = "pending" | "in-progress" | "completed";

export type ProjectUser = {
  _id?: string;
  email: string;
  id?: string;
  name: string;
  role: "admin" | "manager" | "member";
};

export type Project = {
  _id: string;
  archivedAt?: string | null;
  createdAt?: string;
  createdBy?: ProjectUser;
  dueDate?: string | null;
  projectName: string;
  description: string;
  members?: ProjectUser[];
  startDate?: string | null;
  status: ProjectStatus;
  updatedAt?: string;
};

export type CreateProjectInput = {
  projectName: string;
  description: string;
  dueDate?: string;
  startDate?: string;
  status: ProjectStatus;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

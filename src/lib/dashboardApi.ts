import { apiRequest } from "@/lib/apiClient";
import type { DashboardSummary } from "@/types/dashboard";

export const getDashboardSummary = async () => {
  const result = await apiRequest<DashboardSummary>("/api/dashboard/summary");

  return result.data;
};

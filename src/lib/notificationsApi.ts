import { apiRequest } from "@/lib/apiClient";
import type { Notification, NotificationResponse } from "@/types/notification";

type RawNotificationResult = {
  data?: Notification[];
  unreadCount?: number;
};

export const getNotifications = async () => {
  const result = (await apiRequest<Notification[]>("/api/notifications?limit=20")) as RawNotificationResult;

  return {
    notifications: result.data || [],
    unreadCount: result.unreadCount || 0,
  } satisfies NotificationResponse;
};

export const markNotificationRead = async (notificationId: string) => {
  const result = await apiRequest<Notification>(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });

  return result.data;
};

export const markAllNotificationsRead = async () => {
  await apiRequest<{ modifiedCount: number }>("/api/notifications/read-all", {
    method: "PATCH",
  });
};

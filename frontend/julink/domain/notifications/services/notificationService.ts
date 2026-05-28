import { get, patch, del } from "@/util/api/axios";
import { Page } from "@/domain/posts/types";
import { NotificationResponse, UnreadCountResponse } from "../types";

export const getNotifications = (page = 0, size = 10) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("size", String(size));
  return get<Page<NotificationResponse>>(`/notifications?${params.toString()}`);
};

export const getUnreadCount = () => {
  return get<UnreadCountResponse>("/notifications/unread-count");
};

export const markAsRead = (notificationId: string) => {
  return patch<NotificationResponse>(`/notifications/${notificationId}/read`);
};

export const markAllAsRead = () => {
  return patch<{ status: string; updatedCount: number }>("/notifications/read-all");
};

export const deleteNotification = (notificationId: string) => {
  return del<void>(`/notifications/${notificationId}`);
};

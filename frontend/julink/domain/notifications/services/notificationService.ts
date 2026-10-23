import { get, patch, del } from "@/util/api/axios";
import { Page } from "@/domain/posts/types";
import { NotificationResponse, NotificationType, UnreadCountResponse } from "../types";

export interface BackendNotification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  actor_username: string | null;
  kind: string;
  message: string;
  target_type: string;
  target_id: string;
  metadata_json: string | null;
  read: boolean;
  created_at: string;
}

interface BackendPage<T> {
  items: T[];
  next_cursor: string | null;
}

const cursorCache = new Map<string, string>();

export const mapNotification = (
  notification: BackendNotification,
): NotificationResponse => ({
  id: notification.id,
  recipientUsername: "",
  actorUsername: notification.actor_username,
  actorProfilePicture: null,
  type: notification.kind as NotificationType,
  message: notification.message,
  targetType: notification.target_type,
  targetId: notification.target_id,
  read: notification.read,
  metadataJson: notification.metadata_json,
  createdAt: notification.created_at,
});

const toPage = (
  items: NotificationResponse[],
  nextCursor: string | null,
  page: number,
  size: number,
): Page<NotificationResponse> => ({
  content: items,
  pageable: null,
  totalElements: items.length,
  totalPages: nextCursor ? page + 2 : page + 1,
  last: !nextCursor,
  size,
  number: page,
  sort: null,
  first: page === 0,
  numberOfElements: items.length,
  empty: items.length === 0,
});

export const getNotifications = async (page = 0, size = 10) => {
  const cursor = page > 0 ? cursorCache.get(`notifications:${page - 1}`) : undefined;
  const data = await get<BackendPage<BackendNotification>>("/notifications", {
    params: { limit: size, ...(cursor ? { cursor } : {}) },
  });

  if (data.next_cursor) {
    cursorCache.set(`notifications:${page}`, data.next_cursor);
  }

  return toPage(data.items.map(mapNotification), data.next_cursor, page, size);
};

export const getUnreadCount = () =>
  get<UnreadCountResponse>("/notifications/unread-count");

export const markAsRead = async (notificationId: string) => {
  const data = await patch<BackendNotification>(
    `/notifications/${notificationId}/read`,
  );
  return mapNotification(data);
};

export const markAllAsRead = () =>
  patch<{ status: string; updatedCount: number }>("/notifications/read-all");

export const deleteNotification = (notificationId: string) =>
  del<void>(`/notifications/${notificationId}`);

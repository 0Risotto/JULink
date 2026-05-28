export enum NotificationType {
  FOLLOWED_YOU = "FOLLOWED_YOU",
  POST_LIKED = "POST_LIKED",
  POST_COMMENTED = "POST_COMMENTED",
  COMMENT_REPLIED = "COMMENT_REPLIED",
  COMMENT_LIKED = "COMMENT_LIKED",
  NEW_MESSAGE = "NEW_MESSAGE",
  GROUP_CREATED = "GROUP_CREATED",
  GROUP_MEMBER_ADDED = "GROUP_MEMBER_ADDED",
  LOST_AND_FOUND_POSTED = "LOST_AND_FOUND_POSTED",
  LOST_AND_FOUND_CLAIM_REQUESTED = "LOST_AND_FOUND_CLAIM_REQUESTED",
}

export interface NotificationResponse {
  id: string;
  recipientUsername: string;
  actorUsername: string | null;
  actorProfilePicture: string | null;
  type: NotificationType;
  message: string;
  targetType: string;
  targetId: string;
  read: boolean;
  metadataJson: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

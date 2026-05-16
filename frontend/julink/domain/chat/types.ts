export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
export type MessageStatus = "SENT" | "DELIVERED" | "READ";

export interface UserSummary {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
}

export interface MessageResponse {
  id: number;
  conversationId: number;
  sender: UserSummary;
  content: string | null;
  messageType: MessageType;
  status: MessageStatus;
  mediaUrl: string | null;
  mediaFilename: string | null;
  mediaSizeBytes: number | null;
  deleted: boolean;
  sentAt: string;
  editedAt: string | null;
}

export interface ConversationResponse {
  id: number;
  group: boolean;
  groupName: string | null;
  groupPictureUrl: string | null;
  members: UserSummary[];
  lastMessage: MessageResponse | null;
  unreadCount: number;
  updatedAt: string;
}

export interface WsMessageEvent {
  eventType: "NEW_MESSAGE" | "EDIT_MESSAGE" | "DELETE_MESSAGE";
  message: MessageResponse;
}

export interface WsTypingEvent {
  conversationId: number;
  username: string;
  typing: boolean;
}

export interface WsReadEvent {
  conversationId: number;
  username: string;
  lastReadMessageId: number;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

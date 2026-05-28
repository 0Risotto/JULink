export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE";
export type MessageStatus = "SENT" | "DELIVERED" | "READ";

export interface UserSummary {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  profilePictureUrl: string | null;
  admin?: boolean;
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
  sharedPostId?: string | null;
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

export interface GroupCallResponse {
  conversationId: number;
  roomName: string;
  videoUrl: string;
  videoCall: boolean;
  invitedUsernames: string[];
}

export interface UpdateGroupRequest {
  groupName?: string;
  groupPictureUrl?: string;
}

export interface UpdateMemberAdminRequest {
  admin: boolean;
}

export interface StartGroupCallRequest {
  videoCall?: boolean;
}

export interface MediaBytesRequest {
  fileBytes: string; // Base64-encoded string
  filename: string;
  contentType: string;
}

export interface SharePostRequest {
  postId: string;
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

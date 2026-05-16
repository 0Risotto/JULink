import { get, post, patch, del, api } from "@/util/api/axios";
import { ConversationResponse, MessageResponse, Page, MessageType } from "../types";

export const getConversations = (): Promise<ConversationResponse[]> => {
  return get<ConversationResponse[]>("/api/chat/conversations");
};

export const createDM = (targetUsername: string): Promise<ConversationResponse> => {
  return post<ConversationResponse>("/api/chat/conversations/dm", { targetUsername });
};

export const createGroup = (groupName: string, memberUsernames: string[]): Promise<ConversationResponse> => {
  return post<ConversationResponse>("/api/chat/conversations/group", { groupName, memberUsernames });
};

export const addMembersToGroup = (conversationId: number, usernames: string[]): Promise<ConversationResponse> => {
  return post<ConversationResponse>(`/api/chat/conversations/${conversationId}/members`, { usernames });
};

export const getMessages = (conversationId: number, page: number = 0, size: number = 30): Promise<Page<MessageResponse>> => {
  return get<Page<MessageResponse>>(`/api/chat/conversations/${conversationId}/messages`, {
    params: { page, size },
  });
};

export const sendMessage = (conversationId: number, content: string, messageType: MessageType = "TEXT"): Promise<MessageResponse> => {
  return post<MessageResponse>(`/api/chat/conversations/${conversationId}/messages`, {
    content,
    messageType,
  });
};

export const sendMediaMessage = async (conversationId: number, file: File): Promise<MessageResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  // Using api.post directly because the generic `post` wrapper doesn't let us bypass JSON easily
  const response = await api.post(`/api/chat/conversations/${conversationId}/messages/media`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const editMessage = (messageId: number, content: string): Promise<MessageResponse> => {
  return patch<MessageResponse>(`/api/chat/messages/${messageId}`, { content });
};

export const deleteMessage = (messageId: number): Promise<void> => {
  return del<void>(`/api/chat/messages/${messageId}`);
};

export const markReadRest = (conversationId: number, lastReadMessageId: number, username: string): Promise<void> => {
  return post<void>(`/api/chat/conversations/${conversationId}/read`, {
    conversationId,
    lastReadMessageId,
    username,
  });
};

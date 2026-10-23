import { get, post, patch, del } from "@/util/api/axios";
import {
  ConversationResponse,
  MessageResponse,
  Page,
  MessageType,
  UpdateGroupRequest,
  UpdateMemberAdminRequest,
  StartGroupCallRequest,
  SharePostRequest,
  GroupCallResponse,
} from "../types";

interface BackendMember {
  user_id: string;
  username: string;
  role: string;
}

export interface BackendMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_username: string;
  kind: string;
  body: string | null;
  media_url: string | null;
  shared_post_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted: boolean;
}

export interface BackendConversation {
  id: string;
  kind: "dm" | "group";
  title: string | null;
  avatar_url: string | null;
  created_by: string;
  members: BackendMember[];
  last_message: BackendMessage | null;
  unread_count: number;
  created_at: string;
  last_message_at: string | null;
}

interface BackendPage<T> {
  items: T[];
  next_cursor: string | null;
}

interface BackendCall {
  id: string;
  room_name: string;
  jitsi_url: string;
  call_type: string;
  scope: string;
  status: string;
  conversation_id: string | null;
  participants: Array<{
    user_id: string;
    username: string;
    role: string;
    status: string;
  }>;
}

const cursorCache = new Map<string, string>();

const kindToType = (kind: string): MessageType => {
  switch (kind.toUpperCase()) {
    case "IMAGE":
      return "IMAGE";
    case "VIDEO":
      return "VIDEO";
    case "AUDIO":
      return "AUDIO";
    case "FILE":
      return "FILE";
    case "POST_SHARE":
      return "POST_SHARE";
    default:
      return "TEXT";
  }
};

export const mapMessage = (message: BackendMessage): MessageResponse => ({
  id: message.id,
  conversationId: message.conversation_id,
  sender: {
    id: message.sender_id,
    username: message.sender_username,
    firstName: message.sender_username,
    lastName: "",
    profilePictureUrl: null,
  },
  content: message.body,
  messageType: kindToType(message.kind),
  status: "SENT",
  mediaUrl: message.media_url,
  mediaFilename: null,
  mediaSizeBytes: null,
  sharedPostId: message.shared_post_id,
  deleted: message.deleted,
  sentAt: message.created_at,
  editedAt: message.edited_at,
});

export const mapConversation = (
  conversation: BackendConversation,
): ConversationResponse => ({
  id: conversation.id,
  group: conversation.kind === "group",
  groupName: conversation.title,
  groupPictureUrl: conversation.avatar_url,
  members: conversation.members.map((member) => ({
    id: member.user_id,
    username: member.username,
    firstName: member.username,
    lastName: "",
    profilePictureUrl: null,
    admin: member.role === "admin",
  })),
  lastMessage: conversation.last_message
    ? mapMessage(conversation.last_message)
    : null,
  unreadCount: conversation.unread_count,
  updatedAt: conversation.last_message_at || conversation.created_at,
});

const mapCall = (call: BackendCall): GroupCallResponse => ({
  conversationId: call.conversation_id || "",
  roomName: call.room_name,
  videoUrl: call.jitsi_url,
  videoCall: call.call_type === "video",
  invitedUsernames: call.participants
    .filter((participant) => participant.role === "invitee")
    .map((participant) => participant.username),
});

export const getConversations = async (): Promise<ConversationResponse[]> => {
  const data = await get<BackendConversation[]>("/chat/conversations");
  return data.map(mapConversation);
};

export const createDM = async (
  targetUsername: string,
): Promise<ConversationResponse> => {
  const data = await post<BackendConversation>("/chat/conversations/dm", {
    target_username: targetUsername,
  });
  return mapConversation(data);
};

export const createGroup = async (
  groupName: string,
  memberUsernames: string[],
): Promise<ConversationResponse> => {
  const data = await post<BackendConversation>("/chat/conversations/group", {
    title: groupName,
    member_usernames: memberUsernames,
  });
  return mapConversation(data);
};

export const addMembersToGroup = async (
  conversationId: string,
  usernames: string[],
): Promise<ConversationResponse> => {
  const data = await post<BackendConversation>(
    `/chat/conversations/${conversationId}/members`,
    { usernames },
  );
  return mapConversation(data);
};

export const getMessages = async (
  conversationId: string,
  page = 0,
  size = 30,
): Promise<Page<MessageResponse>> => {
  const cursor =
    page > 0 ? cursorCache.get(`messages:${conversationId}:${page - 1}`) : undefined;
  const data = await get<BackendPage<BackendMessage>>(
    `/chat/conversations/${conversationId}/messages`,
    {
      params: { limit: size, ...(cursor ? { cursor } : {}) },
    },
  );

  if (data.next_cursor) {
    cursorCache.set(`messages:${conversationId}:${page}`, data.next_cursor);
  }

  return {
    content: data.items.map(mapMessage),
    totalElements: data.items.length,
    totalPages: data.next_cursor ? page + 2 : page + 1,
    size,
    number: page,
    last: !data.next_cursor,
  };
};

const sendBackendMessage = async (
  conversationId: string,
  payload: Record<string, unknown>,
): Promise<MessageResponse> => {
  const data = await post<BackendMessage>(
    `/chat/conversations/${conversationId}/messages`,
    payload,
  );
  return mapMessage(data);
};

export const sendMessage = (
  conversationId: string,
  content: string,
  messageType: MessageType = "TEXT",
) =>
  sendBackendMessage(conversationId, {
    kind: messageType.toLowerCase(),
    body: content,
  });

const CLOUD_NAME = "deymoklbe";
const UPLOAD_PRESET = "julink_uploads";

export const sendMediaMessage = async (
  conversationId: string,
  file: File,
): Promise<MessageResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const upload = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
    { method: "POST", body: formData },
  );

  if (!upload.ok) {
    throw new Error("Could not upload media");
  }

  const uploaded = (await upload.json()) as { secure_url: string };
  const kind = file.type.startsWith("image/")
    ? "image"
    : file.type.startsWith("video/")
      ? "video"
      : file.type.startsWith("audio/")
        ? "audio"
        : "file";

  return sendBackendMessage(conversationId, {
    kind,
    media_url: uploaded.secure_url,
  });
};

export const editMessage = async (
  messageId: string,
  content: string,
): Promise<MessageResponse> => {
  const data = await patch<BackendMessage>(`/chat/messages/${messageId}`, {
    body: content,
  });
  return mapMessage(data);
};

export const deleteMessage = (messageId: string) =>
  del<void>(`/chat/messages/${messageId}`);

export const markReadRest = (
  conversationId: string,
  lastReadMessageId: string,
  _username?: string,
) =>
  post<void>(`/chat/conversations/${conversationId}/read`, {
    message_id: lastReadMessageId,
  });

export const updateGroup = async (
  conversationId: string,
  req: UpdateGroupRequest,
): Promise<ConversationResponse> => {
  const data = await patch<BackendConversation>(
    `/chat/conversations/${conversationId}/group`,
    { title: req.groupName, avatar_url: req.groupPictureUrl },
  );
  return mapConversation(data);
};

export const removeMember = async (
  conversationId: string,
  memberUsername: string,
): Promise<ConversationResponse> => {
  const data = await del<BackendConversation>(
    `/chat/conversations/${conversationId}/members/${memberUsername}`,
  );
  return mapConversation(data);
};

export const leaveGroup = (
  conversationId: string,
): Promise<void> =>
  post<void>(`/chat/conversations/${conversationId}/leave`, {});

export const updateMemberAdmin = async (
  conversationId: string,
  memberUsername: string,
  req: UpdateMemberAdminRequest,
): Promise<ConversationResponse> => {
  const data = await patch<BackendConversation>(
    `/chat/conversations/${conversationId}/members/${memberUsername}/admin`,
    req,
  );
  return mapConversation(data);
};

export const startGroupCall = async (
  conversationId: string,
  req?: StartGroupCallRequest,
): Promise<GroupCallResponse> => {
  const data = await post<BackendCall>("/calls/group", {
    conversation_id: conversationId,
    call_type: req?.videoCall === false ? "audio" : "video",
  });
  return mapCall(data);
};

export const startDirectCall = async (
  targetUsername: string,
  videoCall = true,
): Promise<GroupCallResponse> => {
  const data = await post<BackendCall>("/calls/direct", {
    target_username: targetUsername,
    call_type: videoCall ? "video" : "audio",
  });
  return mapCall(data);
};

export const sendMediaBytesMessage = async (
  _conversationId: string,
  _req: unknown,
): Promise<MessageResponse> => {
  throw new Error("Use sendMediaMessage with a File instead");
};

export const sharePost = async (
  conversationId: string,
  req: SharePostRequest,
): Promise<MessageResponse> => {
  return sendBackendMessage(conversationId, {
    kind: "post_share",
    shared_post_id: req.postId,
  });
};

export const acceptCall = (callId: string) =>
  post<BackendCall>(`/calls/${callId}/accept`);

export const declineCall = (callId: string) =>
  post<BackendCall>(`/calls/${callId}/decline`);

export const cancelCall = (callId: string) =>
  post<BackendCall>(`/calls/${callId}/cancel`);

export const endCall = (callId: string) =>
  post<BackendCall>(`/calls/${callId}/end`);

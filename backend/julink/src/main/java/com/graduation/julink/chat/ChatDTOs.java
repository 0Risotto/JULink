package com.graduation.julink.chat;

import com.graduation.julink.chat.ChatEntities.MessageStatus;
import com.graduation.julink.chat.ChatEntities.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public final class ChatDTOs {

    private ChatDTOs() {}

    // ─────────────────────────────────────────────────────────────
    // Inbound REST requests
    // ─────────────────────────────────────────────────────────────

    @Data
    public static class CreateDMRequest {
        private String targetUsername; // the person to DM
    }

    @Data
    public static class CreateGroupRequest {
        private String groupName;
        private List<String> memberUsernames; // usernames to add (requester is always added)
    }

    @Data
    public static class AddMembersRequest {
        private List<String> usernames;
    }

    @Data
    public static class SendMessageRequest {
        private String content;
        private MessageType messageType = MessageType.TEXT;
        // mediaUrl/mediaFilename/mediaSizeBytes populated by upload endpoint separately
    }

    @Data
    public static class EditMessageRequest {
        private String content;
    }

    @Data
    public static class MediaBytesRequest {
        private byte[] fileBytes;
        private String filename;
        private String contentType;
    }

    // ─────────────────────────────────────────────────────────────
    // Inbound WebSocket payloads  (sent by the client over STOMP)
    // ─────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WsMessagePayload {
        private Long conversationId;
        private String content;
        private MessageType messageType;
        private String senderUsername; // client echoes their own username
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WsTypingPayload {
        private Long conversationId;
        private String username;
        private boolean typing; // true = started, false = stopped
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WsReadPayload {
        private Long conversationId;
        private Long lastReadMessageId;
        private String username;
    }

    // ─────────────────────────────────────────────────────────────
    // Outbound responses
    // ─────────────────────────────────────────────────────────────

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSummary {
        private Long id;
        private String username;
        private String firstName;
        private String lastName;
        private String profilePictureUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageResponse {
        private Long id;
        private Long conversationId;
        private UserSummary sender;
        private String content;
        private MessageType messageType;
        private MessageStatus status;
        private String mediaUrl;
        private String mediaFilename;
        private Long mediaSizeBytes;
        private boolean deleted;
        private LocalDateTime sentAt;
        private LocalDateTime editedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ConversationResponse {
        private Long id;
        private boolean group;
        private String groupName;
        private String groupPictureUrl;
        private List<UserSummary> members;
        private MessageResponse lastMessage;
        private int unreadCount;
        private LocalDateTime updatedAt;
    }

    /** Broadcast over WebSocket when someone sends a message */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WsMessageEvent {
        private String eventType; // "NEW_MESSAGE" | "EDIT_MESSAGE" | "DELETE_MESSAGE"
        private MessageResponse message;
    }

    /** Broadcast over WebSocket for typing indicators */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WsTypingEvent {
        private Long conversationId;
        private String username;
        private boolean typing;
    }

    /** Broadcast over WebSocket for read receipts */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WsReadEvent {
        private Long conversationId;
        private String username;
        private Long lastReadMessageId;
    }

    /** File upload response */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FileUploadResponse {
        private String mediaUrl;
        private String mediaFilename;
        private Long mediaSizeBytes;
        private MessageType messageType;
    }
}

package com.graduation.julink.video;

import com.graduation.julink.video.VideoEntities.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class VideoDTOs {

    private VideoDTOs() {}

    @Data
    public static class DirectCallRequest {
        private String targetUsername;
        private CallType callType = CallType.VIDEO;
    }

    @Data
    public static class GroupCallRequest {
        private Long conversationId;
        private CallType callType = CallType.VIDEO;
    }

    @Data
    public static class InitiateCallRequest {
        private String username;
        private String caller;
        private CallType callType = CallType.VIDEO;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CallParticipantResponse {
        private String username;
        private ParticipantRole role;
        private ParticipantStatus status;
        private LocalDateTime invitedAt;
        private LocalDateTime respondedAt;
        private LocalDateTime leftAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CallSessionResponse {
        private UUID id;
        private String roomName;
        private String videoUrl;
        private CallType callType;
        private CallScope scope;
        private CallStatus status;
        private String callerUsername;
        private Long conversationId;
        private String groupName;
        private LocalDateTime createdAt;
        private LocalDateTime acceptedAt;
        private LocalDateTime endedAt;
        private LocalDateTime expiresAt;
        private List<CallParticipantResponse> participants;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CallEvent {
        private String type;
        private UUID callId;
        private String roomName;
        private String videoUrl;
        private CallType callType;
        private CallScope scope;
        private CallStatus status;
        private String callerUsername;
        private String targetUsername;
        private Long conversationId;
        private String groupName;
        private List<CallParticipantResponse> participants;
    }
}

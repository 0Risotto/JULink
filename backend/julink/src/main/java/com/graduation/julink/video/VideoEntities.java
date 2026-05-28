package com.graduation.julink.video;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.chat.ChatEntities;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

public final class VideoEntities {

    private VideoEntities() {}

    public enum CallType {
        AUDIO, VIDEO
    }

    public enum CallScope {
        DIRECT, GROUP
    }

    public enum CallStatus {
        RINGING, ACCEPTED, DECLINED, CANCELLED, ENDED, MISSED
    }

    public enum ParticipantRole {
        CALLER, INVITEE
    }

    public enum ParticipantStatus {
        INVITED, ACCEPTED, DECLINED, MISSED, LEFT
    }

    @Entity(name = "CallSession")
    @Getter
    @Setter
    @Table(
            name = "call_sessions",
            indexes = {
                    @Index(name = "idx_call_sessions_status_expires", columnList = "status, expires_at"),
                    @Index(name = "idx_call_sessions_caller_created", columnList = "caller_id, created_at")
            }
    )
    public static class CallSession {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @Column(name = "room_name", nullable = false, unique = true)
        private String roomName;

        @Column(name = "video_url", nullable = false)
        private String videoUrl;

        @Enumerated(EnumType.STRING)
        @Column(name = "call_type", nullable = false, length = 20)
        private CallType callType = CallType.VIDEO;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false, length = 20)
        private CallScope scope = CallScope.DIRECT;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false, length = 20)
        private CallStatus status = CallStatus.RINGING;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "caller_id", nullable = false)
        private AuthEntities.User caller;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "conversation_id")
        private ChatEntities.Conversation conversation;

        @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
        private Set<CallParticipant> participants = new HashSet<>();

        @CreationTimestamp
        @Column(name = "created_at", nullable = false, updatable = false)
        private LocalDateTime createdAt;

        @Column(name = "accepted_at")
        private LocalDateTime acceptedAt;

        @Column(name = "ended_at")
        private LocalDateTime endedAt;

        @Column(name = "expires_at", nullable = false)
        private LocalDateTime expiresAt;
    }

    @Entity(name = "CallParticipant")
    @Getter
    @Setter
    @Table(
            name = "call_participants",
            uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "user_id"}),
            indexes = {
                    @Index(name = "idx_call_participants_user_status", columnList = "user_id, status")
            }
    )
    public static class CallParticipant {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "session_id", nullable = false)
        private CallSession session;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private AuthEntities.User user;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false, length = 20)
        private ParticipantRole role = ParticipantRole.INVITEE;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false, length = 20)
        private ParticipantStatus status = ParticipantStatus.INVITED;

        @CreationTimestamp
        @Column(name = "invited_at", nullable = false, updatable = false)
        private LocalDateTime invitedAt;

        @Column(name = "responded_at")
        private LocalDateTime respondedAt;

        @Column(name = "left_at")
        private LocalDateTime leftAt;
    }
}

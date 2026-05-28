package com.graduation.julink.notification;

import com.graduation.julink.auth.AuthEntities;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

public final class NotificationEntities {
    private NotificationEntities() {}

    @Entity(name = "Notification")
    @Getter
    @Setter
    @Table(
            name = "notifications",
            indexes = {
                    @Index(name = "idx_notifications_recipient_created", columnList = "recipient_id, created_at"),
                    @Index(name = "idx_notifications_recipient_read", columnList = "recipient_id, read")
            }
    )
    public static class Notification {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "recipient_id", nullable = false)
        private AuthEntities.User recipient;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "actor_id")
        private AuthEntities.User actor;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false, length = 50)
        private NotificationType type;

        @Column(nullable = false, columnDefinition = "TEXT")
        private String message;

        @Column(name = "target_type", nullable = false, length = 50)
        private String targetType;

        @Column(name = "target_id", nullable = false, length = 100)
        private String targetId;

        @Column(name = "is_read", nullable = false)
        private boolean read = false;

        @Column(name = "metadata_json", columnDefinition = "TEXT")
        private String metadataJson;

        @Column(name = "created_at", nullable = false, updatable = false)
        private LocalDateTime createdAt = LocalDateTime.now();
    }
}

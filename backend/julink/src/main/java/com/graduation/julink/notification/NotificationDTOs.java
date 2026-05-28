package com.graduation.julink.notification;

import java.time.LocalDateTime;
import java.util.UUID;

public final class NotificationDTOs {
    private NotificationDTOs() {}

    public record NotificationResponse(
            UUID id,
            String recipientUsername,
            String actorUsername,
            String actorProfilePicture,
            NotificationType type,
            String message,
            String targetType,
            String targetId,
            boolean read,
            String metadataJson,
            LocalDateTime createdAt
    ) {}

    public record UnreadCountResponse(long unreadCount) {}
}

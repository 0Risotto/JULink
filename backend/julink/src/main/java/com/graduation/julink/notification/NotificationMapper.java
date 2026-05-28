package com.graduation.julink.notification;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.notification.NotificationDTOs.NotificationResponse;
import com.graduation.julink.notification.NotificationEntities.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {
    public NotificationResponse toResponse(Notification notification) {
        AuthEntities.User actor = notification.getActor();
        return new NotificationResponse(
                notification.getId(),
                notification.getRecipient().getUsername(),
                actor == null ? null : actor.getUsername(),
                actor == null ? null : actor.getProfilePictureUrl(),
                notification.getType(),
                notification.getMessage(),
                notification.getTargetType(),
                notification.getTargetId(),
                notification.isRead(),
                notification.getMetadataJson(),
                notification.getCreatedAt()
        );
    }
}

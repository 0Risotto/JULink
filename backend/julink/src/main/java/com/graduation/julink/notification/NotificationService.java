package com.graduation.julink.notification;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.notification.NotificationDTOs.NotificationResponse;
import com.graduation.julink.notification.NotificationEntities.Notification;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationMapper notificationMapper;
    private final AuthRepository authRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public NotificationResponse notifyUser(
            AuthEntities.User recipient,
            AuthEntities.User actor,
            NotificationType type,
            String message,
            String targetType,
            String targetId,
            String metadataJson
    ) {
        if (recipient == null || targetType == null || targetId == null) {
            return null;
        }
        if (actor != null && Objects.equals(recipient.getId(), actor.getId())) {
            return null;
        }

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setActor(actor);
        notification.setType(type);
        notification.setMessage(message == null || message.isBlank() ? type.name() : message.trim());
        notification.setTargetType(targetType);
        notification.setTargetId(targetId);
        notification.setMetadataJson(metadataJson);

        NotificationResponse response = notificationMapper.toResponse(notificationRepository.save(notification));
        messagingTemplate.convertAndSend("/topic/notifications/" + recipient.getUsername(), response);
        return response;
    }

    @Transactional
    public void notifyUsers(
            Collection<AuthEntities.User> recipients,
            AuthEntities.User actor,
            NotificationType type,
            String message,
            String targetType,
            String targetId,
            String metadataJson
    ) {
        if (recipients == null) {
            return;
        }
        recipients.forEach(recipient -> notifyUser(recipient, actor, type, message, targetType, targetId, metadataJson));
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getUnreadNotifications(String email, Pageable pageable) {
        AuthEntities.User user = getUserByEmail(email);
        return notificationRepository
                .findByRecipient_IdAndReadFalseOrderByCreatedAtDesc(user.getId(), pageable)
                .map(notificationMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        return notificationRepository.countByRecipient_IdAndReadFalse(getUserByEmail(email).getId());
    }

    @Transactional
    public NotificationResponse markAsRead(String email, UUID notificationId) {
        AuthEntities.User user = getUserByEmail(email);
        Notification notification = notificationRepository.findByIdAndRecipient_Id(notificationId, user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Notification not found"));
        notification.setRead(true);
        return notificationMapper.toResponse(notificationRepository.save(notification));
    }

    @Transactional
    public int markAllAsRead(String email) {
        return notificationRepository.markAllUnreadAsRead(getUserByEmail(email).getId());
    }

    @Transactional
    public void deleteNotification(String email, UUID notificationId) {
        AuthEntities.User user = getUserByEmail(email);
        Notification notification = notificationRepository.findByIdAndRecipient_Id(notificationId, user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Notification not found"));
        notificationRepository.delete(notification);
    }

    private AuthEntities.User getUserByEmail(String email) {
        return authRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Authenticated user was not found"));
    }
}

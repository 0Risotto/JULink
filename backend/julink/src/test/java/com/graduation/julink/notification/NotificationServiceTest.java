package com.graduation.julink.notification;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.notification.NotificationDTOs.NotificationResponse;
import com.graduation.julink.notification.NotificationEntities.Notification;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private NotificationMapper notificationMapper;

    @Mock
    private AuthRepository authRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private NotificationService notificationService;

    private AuthEntities.User recipient;
    private AuthEntities.User actor;
    private Notification notification;
    private NotificationResponse response;

    @BeforeEach
    void setUp() {
        recipient = new AuthEntities.User();
        recipient.setId(1L);
        recipient.setUsername("recipient");
        recipient.setEmail("recipient@ju.edu.jo");

        actor = new AuthEntities.User();
        actor.setId(2L);
        actor.setUsername("actor");

        notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setRecipient(recipient);
        notification.setActor(actor);
        notification.setType(NotificationType.FOLLOWED_YOU);
        notification.setMessage("actor followed you");
        notification.setTargetType("PROFILE");
        notification.setTargetId("actor");

        response = new NotificationResponse(
                notification.getId(),
                "recipient",
                "actor",
                null,
                NotificationType.FOLLOWED_YOU,
                "actor followed you",
                "PROFILE",
                "actor",
                false,
                null,
                notification.getCreatedAt()
        );
    }

    @Test
    void notifyUser_PersistsAndPushesNotification() {
        when(notificationRepository.save(any(Notification.class))).thenReturn(notification);
        when(notificationMapper.toResponse(notification)).thenReturn(response);

        NotificationResponse result = notificationService.notifyUser(
                recipient,
                actor,
                NotificationType.FOLLOWED_YOU,
                "actor followed you",
                "PROFILE",
                "actor",
                null
        );

        assertEquals(response, result);
        verify(notificationRepository).save(any(Notification.class));
        verify(messagingTemplate).convertAndSend("/topic/notifications/recipient", response);
    }

    @Test
    void notifyUser_SkipsSelfNotification() {
        NotificationResponse result = notificationService.notifyUser(
                recipient,
                recipient,
                NotificationType.FOLLOWED_YOU,
                "self",
                "PROFILE",
                "recipient",
                null
        );

        assertNull(result);
        verifyNoInteractions(notificationRepository, messagingTemplate);
    }

    @Test
    void getUnreadNotifications_ReturnsUnreadOnly() {
        when(authRepository.findByEmail("recipient@ju.edu.jo")).thenReturn(Optional.of(recipient));
        when(notificationRepository.findByRecipient_IdAndReadFalseOrderByCreatedAtDesc(eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(notification)));
        when(notificationMapper.toResponse(notification)).thenReturn(response);

        Page<NotificationResponse> result = notificationService.getUnreadNotifications("recipient@ju.edu.jo", Pageable.unpaged());

        assertEquals(1, result.getTotalElements());
        assertEquals(response, result.getContent().get(0));
    }

    @Test
    void markAsRead_RejectsOtherUsersNotification() {
        UUID notificationId = UUID.randomUUID();
        when(authRepository.findByEmail("recipient@ju.edu.jo")).thenReturn(Optional.of(recipient));
        when(notificationRepository.findByIdAndRecipient_Id(notificationId, 1L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class,
                () -> notificationService.markAsRead("recipient@ju.edu.jo", notificationId));
    }
}

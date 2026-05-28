package com.graduation.julink.notification;

import com.graduation.julink.notification.NotificationDTOs.NotificationResponse;
import com.graduation.julink.notification.NotificationDTOs.UnreadCountResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private Principal principal;

    @InjectMocks
    private NotificationController notificationController;

    @Test
    void getNotifications_ReturnsCurrentUsersUnreadNotifications() {
        when(principal.getName()).thenReturn("user@ju.edu.jo");
        NotificationResponse notification = response();
        when(notificationService.getUnreadNotifications(eq("user@ju.edu.jo"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(notification)));

        Page<NotificationResponse> result = notificationController.getNotifications(principal, Pageable.unpaged());

        assertEquals(1, result.getTotalElements());
        assertEquals(notification, result.getContent().get(0));
    }

    @Test
    void getUnreadCount_ReturnsCount() {
        when(principal.getName()).thenReturn("user@ju.edu.jo");
        when(notificationService.getUnreadCount("user@ju.edu.jo")).thenReturn(3L);

        UnreadCountResponse result = notificationController.getUnreadCount(principal);

        assertEquals(3L, result.unreadCount());
    }

    @Test
    void markAllAsRead_ReturnsUpdatedCount() {
        when(principal.getName()).thenReturn("user@ju.edu.jo");
        when(notificationService.markAllAsRead("user@ju.edu.jo")).thenReturn(4);

        Map<String, Object> result = notificationController.markAllAsRead(principal);

        assertEquals("success", result.get("status"));
        assertEquals(4, result.get("updatedCount"));
    }

    @Test
    void deleteNotification_ReturnsNoContent() {
        UUID id = UUID.randomUUID();
        when(principal.getName()).thenReturn("user@ju.edu.jo");

        ResponseEntity<Void> result = notificationController.deleteNotification(principal, id);

        assertEquals(204, result.getStatusCode().value());
        verify(notificationService).deleteNotification("user@ju.edu.jo", id);
    }

    private NotificationResponse response() {
        return new NotificationResponse(
                UUID.randomUUID(),
                "user",
                "actor",
                null,
                NotificationType.FOLLOWED_YOU,
                "actor followed you",
                "PROFILE",
                "actor",
                false,
                null,
                LocalDateTime.now()
        );
    }
}

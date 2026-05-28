package com.graduation.julink.notification;

import com.graduation.julink.notification.NotificationDTOs.NotificationResponse;
import com.graduation.julink.notification.NotificationDTOs.UnreadCountResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping
    public Page<NotificationResponse> getNotifications(Principal principal, Pageable pageable) {
        return notificationService.getUnreadNotifications(principal.getName(), pageable);
    }

    @GetMapping("/unread-count")
    public UnreadCountResponse getUnreadCount(Principal principal) {
        return new UnreadCountResponse(notificationService.getUnreadCount(principal.getName()));
    }

    @PatchMapping("/{notificationId}/read")
    public NotificationResponse markAsRead(Principal principal, @PathVariable UUID notificationId) {
        return notificationService.markAsRead(principal.getName(), notificationId);
    }

    @PatchMapping("/read-all")
    public Map<String, Object> markAllAsRead(Principal principal) {
        return Map.of(
                "status", "success",
                "updatedCount", notificationService.markAllAsRead(principal.getName())
        );
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(Principal principal, @PathVariable UUID notificationId) {
        notificationService.deleteNotification(principal.getName(), notificationId);
        return ResponseEntity.noContent().build();
    }
}

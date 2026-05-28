package com.graduation.julink.notification;

import com.graduation.julink.notification.NotificationEntities.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    Page<Notification> findByRecipient_IdAndReadFalseOrderByCreatedAtDesc(Long recipientId, Pageable pageable);

    long countByRecipient_IdAndReadFalse(Long recipientId);

    Optional<Notification> findByIdAndRecipient_Id(UUID id, Long recipientId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient.id = :recipientId AND n.read = false")
    int markAllUnreadAsRead(@Param("recipientId") Long recipientId);

    @Modifying
    @Query("""
            UPDATE Notification n SET n.read = true
            WHERE n.recipient.id = :recipientId
              AND n.read = false
              AND n.targetType = :targetType
              AND n.targetId = :targetId
              AND n.type = :type
            """)
    int markUnreadTargetAsRead(@Param("recipientId") Long recipientId,
                               @Param("targetType") String targetType,
                               @Param("targetId") String targetId,
                               @Param("type") NotificationType type);
}

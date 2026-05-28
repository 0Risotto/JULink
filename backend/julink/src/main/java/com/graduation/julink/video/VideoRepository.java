package com.graduation.julink.video;

import com.graduation.julink.video.VideoEntities.CallSession;
import com.graduation.julink.video.VideoEntities.CallStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VideoRepository extends JpaRepository<CallSession, UUID> {

    @EntityGraph(attributePaths = {"caller", "conversation", "participants", "participants.user"})
    Optional<CallSession> findWithParticipantsById(UUID id);

    @EntityGraph(attributePaths = {"caller", "conversation", "participants", "participants.user"})
    @Query("""
            SELECT DISTINCT s FROM CallSession s
            JOIN s.participants p
            WHERE p.user.id = :userId
              AND s.status IN :statuses
            ORDER BY s.createdAt DESC
            """)
    List<CallSession> findActiveForUser(@Param("userId") Long userId,
                                        @Param("statuses") Collection<CallStatus> statuses);

    @EntityGraph(attributePaths = {"caller", "conversation", "participants", "participants.user"})
    @Query("""
            SELECT DISTINCT s FROM CallSession s
            JOIN s.participants p
            WHERE p.user.id = :userId
            ORDER BY s.createdAt DESC
            """)
    Page<CallSession> findHistoryForUser(@Param("userId") Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"caller", "conversation", "participants", "participants.user"})
    List<CallSession> findByStatusAndExpiresAtBefore(CallStatus status, LocalDateTime expiresAt);
}

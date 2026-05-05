package com.graduation.julink.chat.repo;

import com.graduation.julink.chat.ChatEntities.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Find a DM conversation that contains exactly both users.
     * Uses a double-member-count check to avoid collisions with groups.
     */
    @Query("""
        SELECT c FROM Conversation c
        JOIN c.members m1
        JOIN c.members m2
        WHERE c.group = false
          AND m1.user.id = :userId1
          AND m2.user.id = :userId2
          AND (SELECT COUNT(m) FROM ConversationMember m WHERE m.conversation = c) = 2
        """)
    Optional<Conversation> findDMBetween(@Param("userId1") Long userId1,
                                         @Param("userId2") Long userId2);

    /**
     * All conversations the given user belongs to, sorted by latest activity.
     */
    @Query("""
        SELECT DISTINCT c FROM Conversation c
        JOIN c.members mem
        WHERE mem.user.id = :userId
        ORDER BY c.updatedAt DESC
        """)
    List<Conversation> findAllByUserId(@Param("userId") Long userId);

    /**
     * Check membership.
     */
    @Query("""
        SELECT COUNT(m) > 0 FROM ConversationMember m
        WHERE m.conversation.id = :convId AND m.user.id = :userId
        """)
    boolean isMember(@Param("convId") Long convId, @Param("userId") Long userId);
}

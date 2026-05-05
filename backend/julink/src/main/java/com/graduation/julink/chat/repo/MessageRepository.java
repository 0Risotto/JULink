package com.graduation.julink.chat.repo;

import com.graduation.julink.chat.ChatEntities.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Paginated messages for a conversation — newest first, client reverses for display.
     */
    @Query("""
        SELECT m FROM Message m
        WHERE m.conversation.id = :conversationId
        ORDER BY m.sentAt DESC
        """)
    Page<Message> findByConversationId(@Param("conversationId") Long conversationId,
                                       Pageable pageable);

    /**
     * Count unread messages for a user in a conversation
     * (messages sent after the user's last read receipt for that conversation).
     */
    @Query("""
        SELECT COUNT(m) FROM Message m
        WHERE m.conversation.id = :convId
          AND m.sender.id <> :userId
          AND m.deleted = false
          AND m.id > COALESCE(
              (SELECT MAX(r.message.id)
               FROM MessageReadReceipt r
               WHERE r.message.conversation.id = :convId
                 AND r.user.id = :userId),
              0)
        """)
    int countUnread(@Param("convId") Long convId, @Param("userId") Long userId);

    /**
     * Latest message in a conversation (for conversation list preview).
     */
    @Query("""
        SELECT m FROM Message m
        WHERE m.conversation.id = :conversationId
        ORDER BY m.sentAt DESC
        LIMIT 1
        """)
    Optional<Message> findLatestByConversationId(@Param("conversationId") Long conversationId);
}

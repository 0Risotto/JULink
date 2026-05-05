package com.graduation.julink.chat.repo;

import com.graduation.julink.chat.ChatEntities.MessageReadReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MessageReadReceiptRepository extends JpaRepository<MessageReadReceipt, Long> {

    boolean existsByMessageIdAndUserId(Long messageId, Long userId);

    /**
     * ID of the latest message the user has read in this conversation.
     */
    @Query("""
        SELECT MAX(r.message.id) FROM MessageReadReceipt r
        WHERE r.message.conversation.id = :convId AND r.user.id = :userId
        """)
    Optional<Long> findLastReadMessageId(@Param("convId") Long convId,
                                         @Param("userId") Long userId);
}

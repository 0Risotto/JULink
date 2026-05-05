package com.graduation.julink.chat.repo;

import com.graduation.julink.chat.ChatEntities;
import com.graduation.julink.chat.ChatEntities.ConversationMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {


    Optional<ConversationMember> findByConversationIdAndUserId(Long conversationId, Long userId);

    void deleteByConversationIdAndUserId(Long conversationId, Long userId);

    @Query("SELECT COUNT(m) FROM ConversationMember m WHERE m.conversation.id = :convId")
    int countMembers(@Param("convId") Long convId);
}

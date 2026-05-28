package com.graduation.julink.chat;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.chat.ChatDTOs.ConversationResponse;
import com.graduation.julink.chat.ChatDTOs.MessageResponse;
import com.graduation.julink.chat.ChatEntities.Conversation;
import com.graduation.julink.chat.ChatEntities.ConversationMember;
import com.graduation.julink.chat.ChatEntities.Message;
import com.graduation.julink.chat.ChatEntities.MessageStatus;
import com.graduation.julink.chat.ChatEntities.MessageType;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ChatMapperTest {

    private final ChatMapper mapper = new ChatMapper();

    @Test
    void toMessageResponse_PostShareIncludesSharedPostId() {
        UUID postId = UUID.randomUUID();
        Message message = postShareMessage(postId);

        MessageResponse response = mapper.toMessageResponse(message);

        assertEquals(MessageType.POST_SHARE, response.getMessageType());
        assertEquals(postId, response.getSharedPostId());
        assertNull(response.getContent());
    }

    @Test
    void toMessageResponse_DeletedPostShareHidesSharedPostId() {
        UUID postId = UUID.randomUUID();
        Message message = postShareMessage(postId);
        message.setDeleted(true);

        MessageResponse response = mapper.toMessageResponse(message);

        assertEquals(MessageType.POST_SHARE, response.getMessageType());
        assertNull(response.getSharedPostId());
        assertNull(response.getContent());
    }

    @Test
    void toConversationResponse_MembersIncludeAdminState() {
        User admin = user(101L, "admin");
        User member = user(102L, "member");
        Conversation conversation = new Conversation();
        conversation.setId(1L);
        conversation.setGroup(true);
        conversation.setMembers(new HashSet<>(List.of(
                conversationMember(conversation, admin, true),
                conversationMember(conversation, member, false)
        )));

        ConversationResponse response = mapper.toConversationResponse(conversation, null, 0);

        assertEquals(Boolean.TRUE, response.getMembers().stream()
                .filter(user -> "admin".equals(user.getUsername()))
                .findFirst()
                .orElseThrow()
                .getAdmin());
        assertEquals(Boolean.FALSE, response.getMembers().stream()
                .filter(user -> "member".equals(user.getUsername()))
                .findFirst()
                .orElseThrow()
                .getAdmin());
    }

    private Message postShareMessage(UUID postId) {
        User sender = user(101L, "user1");
        sender.setFirstName("First");
        sender.setLastName("Last");

        Conversation conversation = new Conversation();
        conversation.setId(1L);

        Message message = new Message();
        message.setId(10L);
        message.setConversation(conversation);
        message.setSender(sender);
        message.setMessageType(MessageType.POST_SHARE);
        message.setStatus(MessageStatus.SENT);
        message.setSharedPostId(postId);
        return message;
    }

    private User user(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        return user;
    }

    private ConversationMember conversationMember(Conversation conversation, User user, boolean admin) {
        ConversationMember member = new ConversationMember();
        member.setConversation(conversation);
        member.setUser(user);
        member.setAdmin(admin);
        return member;
    }
}

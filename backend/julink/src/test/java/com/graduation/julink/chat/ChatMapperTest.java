package com.graduation.julink.chat;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.chat.ChatDTOs.MessageResponse;
import com.graduation.julink.chat.ChatEntities.Conversation;
import com.graduation.julink.chat.ChatEntities.Message;
import com.graduation.julink.chat.ChatEntities.MessageStatus;
import com.graduation.julink.chat.ChatEntities.MessageType;
import org.junit.jupiter.api.Test;

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

    private Message postShareMessage(UUID postId) {
        User sender = new User();
        sender.setId(101L);
        sender.setUsername("user1");
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
}

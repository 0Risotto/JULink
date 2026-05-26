package com.graduation.julink.chat.controller;

import com.graduation.julink.chat.ChatDTOs.*;
import com.graduation.julink.chat.service.ChatService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatWebSocketControllerTest {

    @Mock
    private ChatService chatService;

    @InjectMocks
    private ChatWebSocketController chatWebSocketController;

    @Test
    void sendMessage_Success() {
        WsMessagePayload payload = new WsMessagePayload();
        payload.setConversationId(1L);
        payload.setSenderUsername("testuser");

        doNothing().when(chatService).handleWsMessage(payload);

        chatWebSocketController.sendMessage(payload);

        verify(chatService, times(1)).handleWsMessage(payload);
    }

    @Test
    void typing_Success() {
        WsTypingPayload payload = new WsTypingPayload();
        payload.setConversationId(1L);
        payload.setUsername("testuser");
        payload.setTyping(true);

        doNothing().when(chatService).handleTyping(payload);

        chatWebSocketController.typing(payload);

        verify(chatService, times(1)).handleTyping(payload);
    }

    @Test
    void markRead_Success() {
        WsReadPayload payload = new WsReadPayload();
        payload.setConversationId(1L);
        payload.setUsername("testuser");
        payload.setLastReadMessageId(10L);

        doNothing().when(chatService).markRead(1L, 10L, "testuser");

        chatWebSocketController.markRead(payload);

        verify(chatService, times(1)).markRead(1L, 10L, "testuser");
    }
}

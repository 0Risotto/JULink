package com.graduation.julink.chat.controller;

import com.graduation.julink.chat.ChatDTOs.*;
import com.graduation.julink.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

/**
 * STOMP WebSocket controller.
 *
 * Clients connect to /ws (configured in WebSocketConfig) and send frames to
 * the destinations listed below (prefixed with /app per the broker config).
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  Client sends to (with /app prefix)  │  Server broadcasts to │
 * ├──────────────────────────────────────┼───────────────────────┤
 * │  /app/chat.send                      │  /topic/conversations/{id}         │
 * │  /app/chat.typing                    │  /topic/conversations/{id}/typing  │
 * │  /app/chat.read                      │  /topic/conversations/{id}/read    │
 * └──────────────────────────────────────┴───────────────────────┘
 *
 * NOTE: In a production system with JWT-secured WebSockets you would extract
 * the principal from the STOMP headers here.  The current WebSocketConfig
 * intentionally strips security interceptors, so the sender's username is
 * carried in the payload itself (WsMessagePayload#senderUsername).
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;

    /**
     * Receive a new chat message over WebSocket.
     *
     * Client sends:
     * {
     *   "conversationId": 1,
     *   "content": "Hello!",
     *   "messageType": "TEXT",
     *   "senderUsername": "alice"
     * }
     *
     * Broadcasts to: /topic/conversations/{conversationId}
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload WsMessagePayload payload) {
        log.debug("WS message from {} in conv {}", payload.getSenderUsername(), payload.getConversationId());
        chatService.handleWsMessage(payload);
    }

    /**
     * Typing indicator.
     *
     * Client sends:
     * {
     *   "conversationId": 1,
     *   "username": "alice",
     *   "typing": true
     * }
     *
     * Broadcasts to: /topic/conversations/{conversationId}/typing
     */
    @MessageMapping("/chat.typing")
    public void typing(@Payload WsTypingPayload payload) {
        log.debug("Typing indicator from {} in conv {} typing={}", payload.getUsername(),
                payload.getConversationId(), payload.isTyping());
        chatService.handleTyping(payload);
    }

    /**
     * Mark messages as read.
     *
     * Client sends:
     * {
     *   "conversationId": 1,
     *   "lastReadMessageId": 42,
     *   "username": "alice"
     * }
     *
     * Broadcasts to: /topic/conversations/{conversationId}/read
     */
    @MessageMapping("/chat.read")
    public void markRead(@Payload WsReadPayload payload) {
        log.debug("Read receipt from {} in conv {}, last={}", payload.getUsername(),
                payload.getConversationId(), payload.getLastReadMessageId());
        chatService.markRead(payload.getConversationId(), payload.getLastReadMessageId(),
                payload.getUsername());
    }
}

package com.graduation.julink.chat.controller;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.chat.ChatDTOs.*;
import com.graduation.julink.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final AuthRepository authRepository;

    // Helper method to keep the code DRY (Don't Repeat Yourself)
    private String getUsernameFromPrincipal(Principal principal) {
        String email = principal.getName();
        AuthEntities.User user = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        return user.getUsername();
    }

    // ─────────────────────────────────────────────────────────────
    // Conversations
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> listConversations(Principal principal) {
        String username = getUsernameFromPrincipal(principal);
        return ResponseEntity.ok(chatService.listConversations(username));
    }

    @PostMapping("/conversations/dm")
    public ResponseEntity<ConversationResponse> createOrGetDM(
            Principal principal,
            @RequestBody CreateDMRequest req) {
        String username = getUsernameFromPrincipal(principal);
        return ResponseEntity.ok(chatService.getOrCreateDM(username, req));
    }

    @PostMapping("/conversations/group")
    public ResponseEntity<ConversationResponse> createGroup(
            Principal principal,
            @RequestBody CreateGroupRequest req) {
        String username = getUsernameFromPrincipal(principal);
        return ResponseEntity.ok(chatService.createGroup(username, req));
    }

    @PostMapping("/conversations/{conversationId}/members")
    public ResponseEntity<ConversationResponse> addMembers(
            Principal principal,
            @PathVariable Long conversationId,
            @RequestBody AddMembersRequest req) {
        String username = getUsernameFromPrincipal(principal);
        return ResponseEntity.ok(chatService.addMembersToGroup(conversationId, username, req));
    }

    // ─────────────────────────────────────────────────────────────
    // Messages
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageResponse>> getMessages(
            Principal principal,
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        String username = getUsernameFromPrincipal(principal);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(chatService.getMessages(conversationId, username, pageable));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<MessageResponse> sendMessage(
            Principal principal,
            @PathVariable Long conversationId,
            @RequestBody SendMessageRequest req) {
        String username = getUsernameFromPrincipal(principal);
        return ResponseEntity.ok(chatService.sendMessage(conversationId, username, req));
    }

    @PostMapping("/conversations/{conversationId}/messages/media")
    public ResponseEntity<MessageResponse> sendMediaMessage(
            Principal principal,
            @PathVariable Long conversationId,
            @RequestParam("file") MultipartFile file) throws IOException, InterruptedException {
        String username = getUsernameFromPrincipal(principal);
        return ResponseEntity.ok(chatService.sendMediaMessage(conversationId, username, file));
    }

    @PostMapping("/conversations/{conversationId}/messages/media-bytes")
    public ResponseEntity<MessageResponse> sendMediaBytesMessage(
            Principal principal,
            @PathVariable Long conversationId,
            @RequestBody MediaBytesRequest req) throws IOException, InterruptedException {
        String username = getUsernameFromPrincipal(principal);
        return ResponseEntity.ok(chatService.sendMediaMessage(conversationId, username, req));
    }

    @PatchMapping("/messages/{messageId}")
    public ResponseEntity<MessageResponse> editMessage(
            Principal principal,
            @PathVariable Long messageId,
            @RequestBody EditMessageRequest req) {
        String username = getUsernameFromPrincipal(principal);
        return ResponseEntity.ok(chatService.editMessage(messageId, username, req));
    }

    @DeleteMapping("/messages/{messageId}")
    public ResponseEntity<Void> deleteMessage(
            Principal principal,
            @PathVariable Long messageId) {
        String username = getUsernameFromPrincipal(principal);
        chatService.deleteMessage(messageId, username);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────
    // Read Receipts
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/conversations/{conversationId}/read")
    public ResponseEntity<Void> markRead(
            Principal principal,
            @PathVariable Long conversationId,
            @RequestBody WsReadPayload payload) {
        String username = getUsernameFromPrincipal(principal);
        chatService.markRead(conversationId, payload.getLastReadMessageId(), username);
        return ResponseEntity.ok().build();
    }
}

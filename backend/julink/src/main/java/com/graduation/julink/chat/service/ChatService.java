package com.graduation.julink.chat.service;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository; // your existing user repo
import com.graduation.julink.chat.ChatDTOs.*;
import com.graduation.julink.chat.ChatEntities.*;
import com.graduation.julink.chat.ChatMapper;
import com.graduation.julink.chat.repo.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ChatService {

    private final ConversationRepository conversationRepo;
    private final MessageRepository messageRepo;
    private final ConversationMemberRepository memberRepo;
    private final MessageReadReceiptRepository receiptRepo;
    private final AuthRepository userRepo;
    private final FriendshipValidator friendshipValidator;
    private final FileStorageService fileStorageService;
    private final ChatMapper mapper;
    private final SimpMessagingTemplate messagingTemplate;

    // ─────────────────────────────────────────────────────────────
    // Conversations
    // ─────────────────────────────────────────────────────────────

    /**
     * Create or return an existing DM conversation between two users.
     * Both users must be mutual follows (friends).
     */
    public ConversationResponse getOrCreateDM(String requesterUsername, CreateDMRequest req) {
        User requester = loadUser(requesterUsername);
        User target    = loadUserByUsername(req.getTargetUsername());

        // Friend check
        friendshipValidator.assertFriends(requesterUsername, req.getTargetUsername());

        // Re-use existing DM if any
        return conversationRepo.findDMBetween(requester.getId(), target.getId())
                .map(conv -> buildConversationResponse(conv, requester))
                .orElseGet(() -> {
                    Conversation dm = new Conversation();
                    dm.setGroup(false);
                    addMember(dm, requester, false);
                    addMember(dm, target, false);
                    conversationRepo.save(dm);
                    return buildConversationResponse(dm, requester);
                });
    }

    /**
     * Create a group chat. The requester becomes an admin.
     * Every member must be a mutual follow with the requester.
     */
    public ConversationResponse createGroup(String requesterUsername, CreateGroupRequest req) {
        User requester = loadUser(requesterUsername);

        List<User> members = new ArrayList<>();
        members.add(requester);
        for (String username : req.getMemberUsernames()) {
            if (username.equals(requesterUsername)) continue;
            friendshipValidator.assertFriends(requesterUsername, username);
            members.add(loadUserByUsername(username));
        }

        Conversation group = new Conversation();
        group.setGroup(true);
        group.setGroupName(req.getGroupName());

        for (User member : members) {
            addMember(group, member, member.getId().equals(requester.getId()));
        }

        conversationRepo.save(group);
        return buildConversationResponse(group, requester);
    }

    /** Add members to an existing group (admin only). */
    public ConversationResponse addMembersToGroup(Long conversationId,
                                                   String requesterUsername,
                                                   AddMembersRequest req) {
        User requester = loadUser(requesterUsername);
        Conversation conv = loadConversation(conversationId);

        assertMember(conv, requester);
        assertAdmin(conv, requester);
        if (!conv.isGroup()) throw new IllegalStateException("Not a group conversation");

        for (String username : req.getUsernames()) {
            friendshipValidator.assertFriends(requesterUsername, username);
            User newMember = loadUserByUsername(username);
            boolean alreadyIn = memberRepo
                    .findByConversationIdAndUserId(conversationId, newMember.getId())
                    .isPresent();
            if (!alreadyIn) addMember(conv, newMember, false);
        }

        conversationRepo.save(conv);
        return buildConversationResponse(conv, requester);
    }

    /** List all conversations for the current user. */
    @Transactional(readOnly = true)
    public List<ConversationResponse> listConversations(String username) {
        User user = loadUser(username);
        return conversationRepo.findAllByUserId(user.getId()).stream()
                .map(conv -> buildConversationResponse(conv, user))
                .toList();
    }

    // ─────────────────────────────────────────────────────────────
    // Messages
    // ─────────────────────────────────────────────────────────────

    /**
     * Send a text message via REST.
     * Also broadcasts a WebSocket event to all conversation members.
     */
    public MessageResponse sendMessage(Long conversationId,
                                       String senderUsername,
                                       SendMessageRequest req) {
        User sender = loadUser(senderUsername);
        Conversation conv = loadConversation(conversationId);

        assertMember(conv, sender);
        assertFriendshipForConversation(conv, sender);

        Message message = new Message();
        message.setConversation(conv);
        message.setSender(sender);
        message.setContent(req.getContent());
        message.setMessageType(req.getMessageType());
        message.setStatus(MessageStatus.SENT);
        messageRepo.save(message);

        conv.touch();
        conversationRepo.save(conv);

        MessageResponse response = mapper.toMessageResponse(message);
        broadcastMessage(conversationId, "NEW_MESSAGE", response);
        return response;
    }

    /**
     * Upload a media file and create a message record in one shot.
     */
    public MessageResponse sendMediaMessage(Long conversationId,
                                            String senderUsername,
                                            MultipartFile file) throws IOException, InterruptedException {
        return sendUploadedMediaMessage(conversationId, senderUsername, fileStorageService.store(file));
    }

    public MessageResponse sendMediaMessage(Long conversationId,
                                            String senderUsername,
                                            MediaBytesRequest req) throws IOException, InterruptedException {
        return sendUploadedMediaMessage(
                conversationId,
                senderUsername,
                fileStorageService.store(req.getFileBytes(), req.getFilename(), req.getContentType())
        );
    }

    private MessageResponse sendUploadedMediaMessage(Long conversationId,
                                                     String senderUsername,
                                                     FileUploadResponse upload) {
        User sender = loadUser(senderUsername);
        Conversation conv = loadConversation(conversationId);

        assertMember(conv, sender);
        assertFriendshipForConversation(conv, sender);

        Message message = new Message();
        message.setConversation(conv);
        message.setSender(sender);
        message.setMessageType(upload.getMessageType());
        message.setMediaUrl(upload.getMediaUrl());
        message.setMediaFilename(upload.getMediaFilename());
        message.setMediaSizeBytes(upload.getMediaSizeBytes());
        message.setStatus(MessageStatus.SENT);
        messageRepo.save(message);

        conv.touch();
        conversationRepo.save(conv);

        MessageResponse response = mapper.toMessageResponse(message);
        broadcastMessage(conversationId, "NEW_MESSAGE", response);
        return response;
    }

    /** Paginated message history — newest first. */
    @Transactional(readOnly = true)
    public Page<MessageResponse> getMessages(Long conversationId,
                                             String username,
                                             Pageable pageable) {
        User user = loadUser(username);
        Conversation conv = loadConversation(conversationId);
        assertMember(conv, user);

        Page<Message> page = messageRepo.findByConversationId(conversationId, pageable);
        List<MessageResponse> content = page.getContent().stream()
                .map(mapper::toMessageResponse)
                .toList();

        return new PageImpl<>(content, pageable, page.getTotalElements());
    }

    /** Edit a text message (only sender can edit, only TEXT type). */
    public MessageResponse editMessage(Long messageId,
                                       String editorUsername,
                                       EditMessageRequest req) {
        User editor = loadUser(editorUsername);
        Message message = loadMessage(messageId);

        if (!message.getSender().getId().equals(editor.getId())) {
            throw new SecurityException("Only the sender can edit a message");
        }
        if (message.getMessageType() != MessageType.TEXT) {
            throw new IllegalStateException("Only text messages can be edited");
        }
        if (message.isDeleted()) {
            throw new IllegalStateException("Cannot edit a deleted message");
        }

        message.setContent(req.getContent());
        message.setEditedAt(LocalDateTime.now());
        messageRepo.save(message);

        MessageResponse response = mapper.toMessageResponse(message);
        broadcastMessage(message.getConversation().getId(), "EDIT_MESSAGE", response);
        return response;
    }

    /** Soft-delete a message. */
    public void deleteMessage(Long messageId, String requesterUsername) {
        User requester = loadUser(requesterUsername);
        Message message = loadMessage(messageId);

        boolean isSender = message.getSender().getId().equals(requester.getId());
        boolean isGroupAdmin = message.getConversation().isGroup()
                && isAdmin(message.getConversation(), requester);

        if (!isSender && !isGroupAdmin) {
            throw new SecurityException("Not authorized to delete this message");
        }

        message.setDeleted(true);
        messageRepo.save(message);

        MessageResponse response = mapper.toMessageResponse(message);
        broadcastMessage(message.getConversation().getId(), "DELETE_MESSAGE", response);
    }

    // ─────────────────────────────────────────────────────────────
    // Read receipts
    // ─────────────────────────────────────────────────────────────

    /**
     * Mark all messages up to (and including) lastReadMessageId as read.
     * Called via both REST and WebSocket.
     */
    public void markRead(Long conversationId, Long lastReadMessageId, String username) {
        User user = loadUser(username);
        Conversation conv = loadConversation(conversationId);
        assertMember(conv, user);

        Message lastMsg = loadMessage(lastReadMessageId);

        // Persist read receipt if not already stored
        if (!receiptRepo.existsByMessageIdAndUserId(lastReadMessageId, user.getId())) {
            MessageReadReceipt receipt = new MessageReadReceipt();
            receipt.setMessage(lastMsg);
            receipt.setUser(user);
            receiptRepo.save(receipt);

            // Update status of all messages sent by OTHERS up to this ID to READ
            messageRepo.markAsRead(conversationId, user.getId(), lastReadMessageId);
        }

        // Broadcast read event so other members can update their UI
        WsReadEvent event = WsReadEvent.builder()
                .conversationId(conversationId)
                .username(username)
                .lastReadMessageId(lastReadMessageId)
                .build();
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId + "/read", event);
    }

    // ─────────────────────────────────────────────────────────────
    // WebSocket handlers (called by ChatWebSocketController)
    // ─────────────────────────────────────────────────────────────

    /**
     * Handle an inbound WS message — validates, persists, broadcasts.
     */
    public void handleWsMessage(WsMessagePayload payload) {
        User sender = loadUser(payload.getSenderUsername());
        Conversation conv = loadConversation(payload.getConversationId());

        assertMember(conv, sender);
        assertFriendshipForConversation(conv, sender);

        Message message = new Message();
        message.setConversation(conv);
        message.setSender(sender);
        message.setContent(payload.getContent());
        message.setMessageType(
                payload.getMessageType() != null ? payload.getMessageType() : MessageType.TEXT);
        message.setStatus(MessageStatus.SENT);
        messageRepo.save(message);

        conv.touch();
        conversationRepo.save(conv);

        broadcastMessage(conv.getId(), "NEW_MESSAGE", mapper.toMessageResponse(message));
    }

    /**
     * Broadcast a typing indicator to the conversation topic.
     */
    public void handleTyping(WsTypingPayload payload) {
        WsTypingEvent event = WsTypingEvent.builder()
                .conversationId(payload.getConversationId())
                .username(payload.getUsername())
                .typing(payload.isTyping())
                .build();
        messagingTemplate.convertAndSend(
                "/topic/conversations/" + payload.getConversationId() + "/typing", event);
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    private void broadcastMessage(Long conversationId, String eventType, MessageResponse msg) {
        WsMessageEvent event = WsMessageEvent.builder()
                .eventType(eventType)
                .message(msg)
                .build();
        messagingTemplate.convertAndSend("/topic/conversations/" + conversationId, event);
    }

    private ConversationResponse buildConversationResponse(Conversation conv, User viewer) {
        Message last = messageRepo.findLatestByConversationId(conv.getId()).orElse(null);
        int unread   = messageRepo.countUnread(conv.getId(), viewer.getId());
        return mapper.toConversationResponse(conv, last, unread);
    }

    private void addMember(Conversation conv, User user, boolean admin) {
        ConversationMember member = new ConversationMember();
        member.setConversation(conv);
        member.setUser(user);
        member.setAdmin(admin);
        conv.getMembers().add(member);
    }

    private void assertMember(Conversation conv, User user) {
        boolean isMember = conv.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(user.getId()));
        if (!isMember) throw new SecurityException("User is not a member of this conversation");
    }

    private void assertAdmin(Conversation conv, User user) {
        boolean isAdmin = conv.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(user.getId()) && m.isAdmin());
        if (!isAdmin) throw new SecurityException("Only group admins can perform this action");
    }

    private boolean isAdmin(Conversation conv, User user) {
        return conv.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(user.getId()) && m.isAdmin());
    }

    /**
     * For DMs, verify the two members are still mutual follows.
     * For groups, verify the sender is friends with at least one other member
     * (initial creation already validated all members; ongoing membership implies consent).
     */
    private void assertFriendshipForConversation(Conversation conv, User sender) {
        if (!conv.isGroup()) {
            // DM: find the other participant
            conv.getMembers().stream()
                    .filter(m -> !m.getUser().getId().equals(sender.getId()))
                    .findFirst()
                    .ifPresent(other -> friendshipValidator.assertFriends(
                            sender.getUsername(), other.getUser().getUsername()));
        }
        // Groups: membership was validated at creation / add-member time. No per-message check needed.
    }

    private User loadUser(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));
    }

    private User loadUserByUsername(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));
    }

    private Conversation loadConversation(Long id) {
        return conversationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found: " + id));
    }

    private Message loadMessage(Long id) {
        return messageRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Message not found: " + id));
    }
}

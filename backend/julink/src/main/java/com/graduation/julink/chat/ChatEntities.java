package com.graduation.julink.chat;

import com.graduation.julink.auth.AuthEntities;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class ChatEntities {

    private ChatEntities() {}

    public enum MessageType {
        TEXT, IMAGE, FILE, VIDEO, AUDIO, POST_SHARE
    }

    public enum MessageStatus {
        SENT, DELIVERED, READ
    }

    // ─────────────────────────────────────────────────────────────
    // Conversation (DM or Group)
    // ─────────────────────────────────────────────────────────────
    @Entity(name = "Conversation")
    @Getter
    @Setter
    @Table(name = "conversations")
    public static class Conversation {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        /** null = DM, non-null = group */
        @Column(name = "group_name")
        private String groupName;

        @Column(name = "group_picture_url")
        private String groupPictureUrl;

        @Column(name = "is_group", nullable = false)
        private boolean group = false;

        @CreationTimestamp
        @Column(name = "created_at", nullable = false, updatable = false)
        private LocalDateTime createdAt;

        @Column(name = "updated_at")
        private LocalDateTime updatedAt;

        @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
        @OrderBy("sentAt DESC")
        private List<Message> messages = new ArrayList<>();

        @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, orphanRemoval = true)
        private Set<ConversationMember> members = new HashSet<>();

        @PrePersist
        @PreUpdate
        public void touch() {
            updatedAt = LocalDateTime.now();
        }
    }

    // ─────────────────────────────────────────────────────────────
    // ConversationMember (join table with role)
    // ─────────────────────────────────────────────────────────────
    @Entity(name = "ConversationMember")
    @Getter
    @Setter
    @Table(name = "conversation_members",
           uniqueConstraints = @UniqueConstraint(columnNames = {"conversation_id", "user_id"}))
    public static class ConversationMember {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "conversation_id", nullable = false)
        private Conversation conversation;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private AuthEntities.User user;

        /** true = admin (only relevant for group chats) */
        @Column(nullable = false)
        private boolean admin = false;

        @CreationTimestamp
        @Column(name = "joined_at", nullable = false, updatable = false)
        private LocalDateTime joinedAt;
    }

    // ─────────────────────────────────────────────────────────────
    // Message
    // ─────────────────────────────────────────────────────────────
    @Entity(name = "Message")
    @Getter
    @Setter
    @Table(name = "messages")
    public static class Message {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "conversation_id", nullable = false)
        private Conversation conversation;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "sender_id", nullable = false)
        private AuthEntities.User sender;

        @Column(columnDefinition = "TEXT")
        private String content;

        @Enumerated(EnumType.STRING)
        @Column(name = "message_type", nullable = false)
        private MessageType messageType = MessageType.TEXT;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private MessageStatus status = MessageStatus.SENT;

        /** URL for IMAGE / FILE / VIDEO / AUDIO messages */
        @Column(name = "media_url")
        private String mediaUrl;

        @Column(name = "media_filename")
        private String mediaFilename;

        @Column(name = "media_size_bytes")
        private Long mediaSizeBytes;

        @Column(name = "shared_post_id")
        private UUID sharedPostId;

        @Column(name = "deleted", nullable = false)
        private boolean deleted = false;

        @CreationTimestamp
        @Column(name = "sent_at", nullable = false, updatable = false)
        private LocalDateTime sentAt;

        @Column(name = "edited_at")
        private LocalDateTime editedAt;
    }

    // ─────────────────────────────────────────────────────────────
    // MessageReadReceipt — tracks per-user read state in groups
    // ─────────────────────────────────────────────────────────────
    @Entity(name = "MessageReadReceipt")
    @Getter
    @Setter
    @Table(name = "message_read_receipts",
           uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "user_id"}))
    public static class MessageReadReceipt {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "message_id", nullable = false)
        private Message message;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private AuthEntities.User user;

        @CreationTimestamp
        @Column(name = "read_at", nullable = false, updatable = false)
        private LocalDateTime readAt;
    }
}

package com.graduation.julink.post;

import com.graduation.julink.auth.AuthEntities.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class PostEntities {
    private PostEntities() {} // Prevent instantiation

    public enum PostVisibility {
        PUBLIC,
        FOLLOWERS_ONLY,
        PRIVATE
    }

    public enum AttachmentType {
        IMAGE,
        VIDEO,
        FILE
    }

    @Entity(name = "Post")
    @Setter
    @Getter
    @Table(name = "posts")
    public static class Post {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID postId;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "owner_id", nullable = false)
        private User owner;

        @Column(nullable = false, columnDefinition = "TEXT")
        private String description;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private PostVisibility visibility = PostVisibility.PUBLIC;

        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt = LocalDateTime.now();

        private LocalDateTime updatedAt;

        @OneToMany(mappedBy = "post", cascade = CascadeType.REMOVE, orphanRemoval = true)
        private List<PostAttachment> attachments = new ArrayList<>();

        @OneToMany(mappedBy = "post", cascade = CascadeType.REMOVE, orphanRemoval = true)
        private List<PostHashtag> hashtags = new ArrayList<>();

        @OneToMany(mappedBy = "post", cascade = CascadeType.REMOVE, orphanRemoval = true)
        private List<PostLike> likes = new ArrayList<>();

        @OneToMany(mappedBy = "post", cascade = CascadeType.REMOVE, orphanRemoval = true)
        private List<PostFavorite> favorites = new ArrayList<>();

        @OneToMany(mappedBy = "post", cascade = CascadeType.REMOVE, orphanRemoval = true)
        private List<PostComment> comments = new ArrayList<>();
    }

    @Entity(name = "PostAttachment")
    @Setter
    @Getter
    @Table(name = "post_attachments")
    public static class PostAttachment {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID attachmentId;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "post_id", nullable = false)
        private Post post;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private AttachmentType attachmentType;

        @Column(nullable = false, columnDefinition = "TEXT")
        private String attachmentUrl;

        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt = LocalDateTime.now();
    }

    @Entity(name = "Hashtag")
    @Setter
    @Getter
    @Table(
            name = "hashtags",
            uniqueConstraints = {
                    @UniqueConstraint(columnNames = "name")
            }
    )
    public static class Hashtag {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID hashtagId;

        @Column(nullable = false, unique = true)
        private String name;

        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt = LocalDateTime.now();
    }

    @Entity(name = "PostHashtag")
    @Setter
    @Getter
    @Table(
            name = "post_hashtags",
            uniqueConstraints = {
                    @UniqueConstraint(columnNames = {"post_id", "hashtag_id"})
            }
    )
    public static class PostHashtag {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "post_id", nullable = false)
        private Post post;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "hashtag_id", nullable = false)
        private Hashtag hashtag;
    }

    @Entity(name = "PostLike")
    @Setter
    @Getter
    @Table(
            name = "post_likes",
            uniqueConstraints = {
                    @UniqueConstraint(columnNames = {"post_id", "user_id"})
            }
    )
    public static class PostLike {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID likeId;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "post_id", nullable = false)
        private Post post;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private User user;

        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt = LocalDateTime.now();
    }

    @Entity(name = "PostFavorite")
    @Setter
    @Getter
    @Table(
            name = "post_favorites",
            uniqueConstraints = {
                    @UniqueConstraint(columnNames = {"post_id", "user_id"})
            }
    )
    public static class PostFavorite {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID favoriteId;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "post_id", nullable = false)
        private Post post;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private User user;

        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt = LocalDateTime.now();
    }

    @Entity(name = "PostComment")
    @Setter
    @Getter
    @Table(name = "post_comments")
    public static class PostComment {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID commentId;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "post_id", nullable = false)
        private Post post;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private User user;

        @Column(nullable = false, columnDefinition = "TEXT")
        private String content;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "parent_comment_id")
        private PostComment parentComment;

        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt = LocalDateTime.now();

        private LocalDateTime updatedAt;

        @OneToMany(mappedBy = "parentComment", cascade = CascadeType.REMOVE, orphanRemoval = true)
        private List<PostComment> replies = new ArrayList<>();

        @OneToMany(mappedBy = "comment", cascade = CascadeType.REMOVE, orphanRemoval = true)
        private List<CommentLike> likes = new ArrayList<>();
    }

    @Entity(name = "CommentLike")
    @Setter
    @Getter
    @Table(
            name = "comment_likes",
            uniqueConstraints = {
                    @UniqueConstraint(columnNames = {"comment_id", "user_id"})
            }
    )
    public static class CommentLike {
        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID commentLikeId;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "comment_id", nullable = false)
        private PostComment comment;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "user_id", nullable = false)
        private User user;

        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt = LocalDateTime.now();
    }
}

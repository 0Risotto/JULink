package com.graduation.julink.post;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class PostDTOs {
    private PostDTOs() {} // Prevent instantiation

    // Used when creating a new post
    public record CreatePostDTO(
            String description,
            String visibility,
            List<AttachmentDTO> attachments
    ) {}

    // Used when editing an existing post
    public record UpdatePostDTO(
            String description,
            String visibility,
            List<AttachmentDTO> attachments
    ) {}

    // Used inside create/update requests
    public record AttachmentDTO(
            String attachmentType,
            String attachmentUrl
    ) {}

    // Used when returning attachments to frontend
    public record AttachmentResponseDTO(
            UUID attachmentId,
            String attachmentType,
            String attachmentUrl,
            LocalDateTime createdAt
    ) {}

    // Main response for a post
    public record PostResponseDTO(
            UUID postId,

            Long ownerId,
            String ownerUsername,
            String ownerFirstName,
            String ownerLastName,
            String ownerProfilePictureUrl,

            String description,
            String visibility,

            List<AttachmentResponseDTO> attachments,
            List<String> hashtags,

            long likesCount,
            long commentsCount,
            boolean likedByCurrentUser,

            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    public record CommentLikeResponseDTO(
            UUID commentId,
            boolean liked,
            long likesCount
    ) {}

    // Used after liking/unliking/toggling a like
    public record LikeResponseDTO(
            UUID postId,
            boolean liked,
            long likesCount
    ) {}

    // Used when creating a comment or reply
    public record CreateCommentDTO(
            String content,
            UUID parentCommentId
    ) {}

    // Used when editing a comment
    public record UpdateCommentDTO(
            String content
    ) {}

    // Used when returning comments to frontend
    public record CommentResponseDTO(
            UUID commentId,
            UUID postId,

            Long userId,
            String username,
            String firstName,
            String lastName,
            String profilePictureUrl,

            String content,
            UUID parentCommentId,

            long likesCount,
            boolean likedByCurrentUser,

            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    // Used for hashtag pages/trending hashtags
    public record HashtagResponseDTO(
            UUID hashtagId,
            String name,
            long postsCount
    ) {}
}
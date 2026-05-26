package com.graduation.julink.post;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class PostDTOs {
    private PostDTOs() {} // Prevent instantiation

    // Used when creating a new post
    public record CreatePostDTO(
            @NotBlank @Size(max = 2_000) String description,
            @Size(max = 10) List<@Valid AttachmentDTO> attachments
    ) {}

    // Used when editing an existing post
    public record UpdatePostDTO(
            @NotBlank @Size(max = 2_000) String description,
            @Size(max = 10) List<@Valid AttachmentDTO> attachments
    ) {}

    // Used inside create/update requests
    public record AttachmentDTO(
            @NotBlank String attachmentType,
            @Size(max = 2_000)
            String attachmentUrl,
            byte[] fileBytes,
            @Size(max = 255)
            String filename,
            @Size(max = 100)
            String contentType
    ) {
        public AttachmentDTO(String attachmentType, String attachmentUrl) {
            this(attachmentType, attachmentUrl, null, null, null);
        }
    }

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

            List<AttachmentResponseDTO> attachments,
            List<String> hashtags,

            long likesCount,
            long commentsCount,
            boolean likedByCurrentUser,
            boolean favoritedByCurrentUser,
            boolean seenByCurrentUser,

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

    // Used after favoriting/unfavoriting/toggling a favorite
    public record FavoriteResponseDTO(
            UUID postId,
            boolean favorited,
            long favoritesCount
    ) {}

    // Used when creating a comment or reply
    public record CreateCommentDTO(
            @NotBlank @Size(max = 1_000) String content,
            UUID parentCommentId
    ) {}

    // Used when editing a comment
    public record UpdateCommentDTO(
            @NotBlank @Size(max = 1_000) String content
    ) {}

    public record PostMediaUploadResponseDTO(
            String attachmentType,
            String attachmentUrl,
            String filename,
            String contentType
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

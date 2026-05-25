package com.graduation.julink.post;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.post.PostDTOs.*;
import com.graduation.julink.post.PostEntities.*;

import java.util.List;
import java.util.UUID;

public final class PostMapper {
    private PostMapper() {} // Prevent instantiation

    public static PostResponseDTO toPostResponseDTO(
            Post post,
            List<PostAttachment> attachments,
            List<String> hashtags,
            long likesCount,
            long commentsCount,
            boolean likedByCurrentUser
    ) {
        User owner = post.getOwner();

        List<AttachmentResponseDTO> attachmentDTOs = attachments == null
                ? List.of()
                : attachments.stream()
                .map(PostMapper::toAttachmentResponseDTO)
                .toList();

        return new PostResponseDTO(
                post.getPostId(),

                owner.getId(),
                owner.getUsername(),
                owner.getFirstName(),
                owner.getLastName(),
                owner.getProfilePictureUrl(),

                post.getDescription(),
                post.getVisibility().name(),

                attachmentDTOs,
                hashtags == null ? List.of() : hashtags,

                likesCount,
                commentsCount,
                likedByCurrentUser,

                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    public static AttachmentResponseDTO toAttachmentResponseDTO(PostAttachment attachment) {
        return new AttachmentResponseDTO(
                attachment.getAttachmentId(),
                attachment.getAttachmentType().name(),
                attachment.getAttachmentUrl(),
                attachment.getCreatedAt()
        );
    }

    public static PostAttachment toPostAttachmentEntity(Post post, AttachmentDTO dto) {
        PostAttachment attachment = new PostAttachment();

        attachment.setPost(post);
        attachment.setAttachmentType(parseAttachmentType(dto.attachmentType()));
        attachment.setAttachmentUrl(dto.attachmentUrl());

        return attachment;
    }
    public static CommentResponseDTO toCommentResponseDTO(
            PostComment comment,
            long likesCount,
            boolean likedByCurrentUser
    ) {
        User user = comment.getUser();

        UUID parentCommentId = comment.getParentComment() == null
                ? null
                : comment.getParentComment().getCommentId();

        return new CommentResponseDTO(
                comment.getCommentId(),
                comment.getPost().getPostId(),

                user.getId(),
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePictureUrl(),

                comment.getContent(),
                parentCommentId,

                likesCount,
                likedByCurrentUser,

                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }

    public static HashtagResponseDTO toHashtagResponseDTO(
            Hashtag hashtag,
            long postsCount
    ) {
        return new HashtagResponseDTO(
                hashtag.getHashtagId(),
                hashtag.getName(),
                postsCount
        );
    }



    public static PostVisibility parsePostVisibility(String visibility) {
        if (visibility == null || visibility.isBlank()) {
            return PostVisibility.PUBLIC;
        }

        return PostVisibility.valueOf(visibility.trim().toUpperCase());
    }

    public static AttachmentType parseAttachmentType(String attachmentType) {
        if (attachmentType == null || attachmentType.isBlank()) {
            throw new IllegalArgumentException("Attachment type is required");
        }

        return AttachmentType.valueOf(attachmentType.trim().toUpperCase());
    }

    public static String normalizeHashtag(String hashtag) {
        if (hashtag == null) {
            return null;
        }

        return hashtag
                .trim()
                .replace("#", "")
                .toLowerCase();
    }
}

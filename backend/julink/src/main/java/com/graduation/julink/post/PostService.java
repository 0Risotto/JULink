package com.graduation.julink.post;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.post.PostDTOs.*;
import com.graduation.julink.post.PostEntities.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostAttachmentRepository postAttachmentRepository;
    private final HashtagRepository hashtagRepository;
    private final PostHashtagRepository postHashtagRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final CommentLikeRepository commentLikeRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#(\\w+)");

    @Transactional
    public PostResponseDTO createPost(Long ownerId, CreatePostDTO dto) {
        User owner = getUserOrThrow(ownerId);

        Post post = new Post();
        post.setOwner(owner);
        post.setDescription(dto.description());
        post.setVisibility(PostMapper.parsePostVisibility(dto.visibility()));

        Post savedPost = postRepository.save(post);

        saveAttachments(savedPost, dto.attachments());
        saveHashtags(savedPost, extractHashtags(dto.description()));

        return buildPostResponse(savedPost, ownerId);
    }

    @Transactional(readOnly = true)
    public PostResponseDTO getPostById(Long currentUserId, UUID postId) {
        Post post = getPostOrThrow(postId);
        return buildPostResponse(post, currentUserId);
    }

    @Transactional
    public PostResponseDTO updatePost(Long ownerId, UUID postId, UpdatePostDTO dto) {
        Post post = getPostOrThrow(postId);

        if (!post.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("You are not allowed to update this post");
        }

        post.setDescription(dto.description());
        post.setVisibility(PostMapper.parsePostVisibility(dto.visibility()));
        post.setUpdatedAt(LocalDateTime.now());

        Post updatedPost = postRepository.save(post);

        postAttachmentRepository.deleteByPost_PostId(postId);
        postHashtagRepository.deleteByPost_PostId(postId);

        saveAttachments(updatedPost, dto.attachments());
        saveHashtags(updatedPost, extractHashtags(dto.description()));

        return buildPostResponse(updatedPost, ownerId);
    }

    @Transactional
    public void deletePost(Long ownerId, UUID postId) {
        Post post = getPostOrThrow(postId);

        if (!post.getOwner().getId().equals(ownerId)) {
            throw new RuntimeException("You are not allowed to delete this post");
        }

        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDTO> getUserPosts(Long currentUserId, Long ownerId, Pageable pageable) {
        return postRepository
                .findByOwner_IdOrderByCreatedAtDesc(ownerId, pageable)
                .map(post -> buildPostResponse(post, currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDTO> getHomeFeed(Long currentUserId, Pageable pageable) {
        /*
         For now, this returns the current user's own posts.
         Later, when we connect Neo4j follow data here, this becomes:
         - get followed user IDs from Neo4j
         - add currentUserId
         - fetch posts by owner IDs
        */

        return postRepository
                .findByOwner_IdOrderByCreatedAtDesc(currentUserId, pageable)
                .map(post -> buildPostResponse(post, currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDTO> getRecommendedPosts(Long currentUserId, Pageable pageable) {
        /*
         Placeholder for Neo4j recommendation results.
         Later this will receive post IDs from Neo4j and fetch them from PostgreSQL.
        */

        return Page.empty(pageable);
    }

    @Transactional
    public LikeResponseDTO likePost(Long userId, UUID postId) {
        User user = getUserOrThrow(userId);
        Post post = getPostOrThrow(postId);

        Optional<PostLike> existingLike =
                postLikeRepository.findByPost_PostIdAndUser_Id(postId, userId);

        if (existingLike.isEmpty()) {
            PostLike like = new PostLike();
            like.setPost(post);
            like.setUser(user);
            postLikeRepository.save(like);
        }

        long likesCount = postLikeRepository.countByPost_PostId(postId);

        return new LikeResponseDTO(
                postId,
                true,
                likesCount
        );
    }

    @Transactional
    public LikeResponseDTO unlikePost(Long userId, UUID postId) {
        getUserOrThrow(userId);
        getPostOrThrow(postId);

        postLikeRepository.deleteByPost_PostIdAndUser_Id(postId, userId);

        long likesCount = postLikeRepository.countByPost_PostId(postId);

        return new LikeResponseDTO(
                postId,
                false,
                likesCount
        );
    }

    @Transactional
    public LikeResponseDTO toggleLike(Long userId, UUID postId) {
        boolean alreadyLiked =
                postLikeRepository.existsByPost_PostIdAndUser_Id(postId, userId);

        if (alreadyLiked) {
            return unlikePost(userId, postId);
        }

        return likePost(userId, postId);
    }

    @Transactional
    public CommentResponseDTO createComment(Long userId, UUID postId, CreateCommentDTO dto) {
        User user = getUserOrThrow(userId);
        Post post = getPostOrThrow(postId);

        PostComment comment = new PostComment();
        comment.setUser(user);
        comment.setPost(post);
        comment.setContent(dto.content());

        if (dto.parentCommentId() != null) {
            PostComment parentComment = getCommentOrThrow(dto.parentCommentId());
            comment.setParentComment(parentComment);
        }

        PostComment savedComment = postCommentRepository.save(comment);

        return buildCommentResponse(savedComment, userId);
    }

    @Transactional(readOnly = true)
    public Page<CommentResponseDTO> getPostComments(
            Long currentUserId,
            UUID postId,
            String sortBy,
            Pageable pageable
    ) {
        getPostOrThrow(postId);

        Page<PostComment> comments;

        if ("oldest".equalsIgnoreCase(sortBy)) {
            comments = postCommentRepository
                    .findByPost_PostIdAndParentCommentIsNullOrderByCreatedAtAsc(postId, pageable);
        } else if ("most_liked".equalsIgnoreCase(sortBy)) {
            comments = postCommentRepository
                    .findTopLevelCommentsOrderByLikes(postId, pageable);
        } else {
            comments = postCommentRepository
                    .findByPost_PostIdAndParentCommentIsNullOrderByCreatedAtDesc(postId, pageable);
        }

        return comments.map(comment -> buildCommentResponse(comment, currentUserId));
    }

    @Transactional
    public CommentResponseDTO updateComment(Long userId, UUID commentId, UpdateCommentDTO dto) {
        PostComment comment = getCommentOrThrow(commentId);

        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("You are not allowed to update this comment");
        }

        comment.setContent(dto.content());
        comment.setUpdatedAt(LocalDateTime.now());

        PostComment updatedComment = postCommentRepository.save(comment);

        return buildCommentResponse(updatedComment, userId);
    }

    @Transactional
    public void deleteComment(Long userId, UUID commentId) {
        PostComment comment = getCommentOrThrow(commentId);

        boolean isCommentOwner = comment.getUser().getId().equals(userId);
        boolean isPostOwner = comment.getPost().getOwner().getId().equals(userId);

        if (!isCommentOwner && !isPostOwner) {
            throw new RuntimeException("You are not allowed to delete this comment");
        }

        postCommentRepository.delete(comment);
    }

    @Transactional
    public CommentLikeResponseDTO likeComment(Long userId, UUID commentId) {
        User user = getUserOrThrow(userId);
        PostComment comment = getCommentOrThrow(commentId);

        Optional<CommentLike> existingLike =
                commentLikeRepository.findByComment_CommentIdAndUser_Id(commentId, userId);

        if (existingLike.isEmpty()) {
            CommentLike like = new CommentLike();
            like.setUser(user);
            like.setComment(comment);
            commentLikeRepository.save(like);
        }

        long likesCount = commentLikeRepository.countByComment_CommentId(commentId);

        return new CommentLikeResponseDTO(
                commentId,
                true,
                likesCount
        );
    }

    @Transactional
    public CommentLikeResponseDTO unlikeComment(Long userId, UUID commentId) {
        getUserOrThrow(userId);
        getCommentOrThrow(commentId);

        commentLikeRepository.deleteByComment_CommentIdAndUser_Id(commentId, userId);

        long likesCount = commentLikeRepository.countByComment_CommentId(commentId);

        return new CommentLikeResponseDTO(
                commentId,
                false,
                likesCount
        );
    }

    @Transactional
    public CommentLikeResponseDTO toggleCommentLike(Long userId, UUID commentId) {
        boolean alreadyLiked =
                commentLikeRepository.existsByComment_CommentIdAndUser_Id(commentId, userId);

        if (alreadyLiked) {
            return unlikeComment(userId, commentId);
        }

        return likeComment(userId, commentId);
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDTO> getPostsByHashtag(
            Long currentUserId,
            String hashtagName,
            Pageable pageable
    ) {
        String normalized = PostMapper.normalizeHashtag(hashtagName);

        return postHashtagRepository
                .findPostsByHashtagName(normalized, pageable)
                .map(post -> buildPostResponse(post, currentUserId));
    }

    @Transactional(readOnly = true)
    public Page<HashtagResponseDTO> getTrendingHashtags(Pageable pageable) {
        return hashtagRepository
                .findTrendingHashtags(pageable)
                .map(hashtag -> PostMapper.toHashtagResponseDTO(
                        hashtag,
                        hashtagRepository.countPostsByHashtagId(hashtag.getHashtagId())
                ));
    }

    private PostResponseDTO buildPostResponse(Post post, Long currentUserId) {
        UUID postId = post.getPostId();

        List<PostAttachment> attachments =
                postAttachmentRepository.findByPost_PostId(postId);

        List<String> hashtags =
                postHashtagRepository.findHashtagNamesByPostId(postId);

        long likesCount =
                postLikeRepository.countByPost_PostId(postId);

        long commentsCount =
                postCommentRepository.countByPost_PostId(postId);

        boolean likedByCurrentUser =
                currentUserId != null &&
                        postLikeRepository.existsByPost_PostIdAndUser_Id(postId, currentUserId);

        return PostMapper.toPostResponseDTO(
                post,
                attachments,
                hashtags,
                likesCount,
                commentsCount,
                likedByCurrentUser
        );
    }

    private CommentResponseDTO buildCommentResponse(PostComment comment, Long currentUserId) {
        UUID commentId = comment.getCommentId();

        long likesCount =
                commentLikeRepository.countByComment_CommentId(commentId);

        boolean likedByCurrentUser =
                currentUserId != null &&
                        commentLikeRepository.existsByComment_CommentIdAndUser_Id(commentId, currentUserId);

        return PostMapper.toCommentResponseDTO(
                comment,
                likesCount,
                likedByCurrentUser
        );
    }

    private void saveAttachments(Post post, List<AttachmentDTO> attachments) {
        if (attachments == null || attachments.isEmpty()) {
            return;
        }

        List<PostAttachment> attachmentEntities = attachments.stream()
                .map(dto -> PostMapper.toPostAttachmentEntity(post, dto))
                .toList();

        postAttachmentRepository.saveAll(attachmentEntities);
    }

    private void saveHashtags(Post post, Set<String> hashtagNames) {
        if (hashtagNames == null || hashtagNames.isEmpty()) {
            return;
        }

        for (String name : hashtagNames) {
            Hashtag hashtag = hashtagRepository
                    .findByName(name)
                    .orElseGet(() -> {
                        Hashtag newHashtag = new Hashtag();
                        newHashtag.setName(name);
                        return hashtagRepository.save(newHashtag);
                    });

            PostHashtag postHashtag = new PostHashtag();
            postHashtag.setPost(post);
            postHashtag.setHashtag(hashtag);

            postHashtagRepository.save(postHashtag);
        }
    }

    private Set<String> extractHashtags(String description) {
        if (description == null || description.isBlank()) {
            return Set.of();
        }

        Set<String> hashtags = new LinkedHashSet<>();

        Matcher matcher = HASHTAG_PATTERN.matcher(description);

        while (matcher.find()) {
            String hashtag = PostMapper.normalizeHashtag(matcher.group(1));

            if (hashtag != null && !hashtag.isBlank()) {
                hashtags.add(hashtag);
            }
        }

        return hashtags;
    }

    private User getUserOrThrow(Long userId) {
        User user = entityManager.find(User.class, userId);

        if (user == null) {
            throw new RuntimeException("User not found with id: " + userId);
        }

        return user;
    }

    private Post getPostOrThrow(UUID postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
    }

    private PostComment getCommentOrThrow(UUID commentId) {
        return postCommentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
    }
}
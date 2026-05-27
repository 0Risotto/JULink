package com.graduation.julink.post;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.common.media.MediaUploadService;
import com.graduation.julink.common.media.MediaUploadService.ImageVariant;
import com.graduation.julink.common.media.MediaUploadService.MediaUploadRequest;
import com.graduation.julink.common.media.MediaUploadService.MediaUploadResult;
import com.graduation.julink.follow.FollowService;
import com.graduation.julink.post.PostDTOs.*;
import com.graduation.julink.post.PostEntities.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostAttachmentRepository postAttachmentRepository;
    private final HashtagRepository hashtagRepository;
    private final PostHashtagRepository postHashtagRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostFavoriteRepository postFavoriteRepository;
    private final PostCommentRepository postCommentRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostImpressionRepository postImpressionRepository;
    private final FollowService followService;
    private final MediaUploadService mediaUploadService;

    @PersistenceContext
    private EntityManager entityManager;

    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#(\\w+)");
    private static final int MAX_FEED_CANDIDATES = 500;

    @Transactional
    public PostResponseDTO createPost(Long ownerId, CreatePostDTO dto) {
        User owner = getUserOrThrow(ownerId);

        Post post = new Post();
        post.setOwner(owner);
        post.setDescription(dto.description());

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
            throw new SecurityException("You are not allowed to update this post");
        }

        post.setDescription(dto.description());
        post.setUpdatedAt(LocalDateTime.now());

        Post updatedPost = postRepository.save(post);

        postHashtagRepository.deleteByPost_PostId(postId);

        if (dto.attachments() != null) {
            postAttachmentRepository.deleteByPost_PostId(postId);
            saveAttachments(updatedPost, dto.attachments());
        }
        saveHashtags(updatedPost, extractHashtags(dto.description()));

        return buildPostResponse(updatedPost, ownerId);
    }

    @Transactional
    public void deletePost(Long ownerId, UUID postId) {
        Post post = getPostOrThrow(postId);

        if (!post.getOwner().getId().equals(ownerId)) {
            throw new SecurityException("You are not allowed to delete this post");
        }

        postRepository.delete(post);
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDTO> getUserPosts(Long currentUserId, String ownerUsername, Pageable pageable) {
        getUserOrThrow(currentUserId);

        return buildPostResponsePage(
                postRepository.findByOwner_UsernameOrderByCreatedAtDesc(ownerUsername, pageable),
                currentUserId
        );
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDTO> getHomeFeed(Long currentUserId, Pageable pageable) {
        Pageable effectivePageable = pageable.isPaged() ? pageable : PageRequest.of(0, 20);
        User currentUser = getUserOrThrow(currentUserId);
        Set<String> followingUsernames = followingUsernamesFor(currentUser);
        Pageable candidatePage = PageRequest.of(
                0,
                Math.max(MAX_FEED_CANDIDATES, effectivePageable.getPageSize() + (int) effectivePageable.getOffset()),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        List<Post> candidates = postRepository.findAllByOrderByCreatedAtDesc(candidatePage).getContent();
        List<UUID> candidatePostIds = candidates.stream().map(Post::getPostId).toList();
        Set<UUID> seenPostIds = candidatePostIds.isEmpty()
                ? Set.of()
                : new HashSet<>(postImpressionRepository.findSeenPostIdsByUserIdAndPostIds(currentUserId, candidatePostIds));

        List<Post> rankedPosts = candidates
                .stream()
                .sorted(Comparator.comparingDouble(
                        post -> -feedScore(post, currentUser, followingUsernames, seenPostIds)
                ))
                .toList();

        return pageFromRankedPosts(rankedPosts, effectivePageable, currentUserId);
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
            saveIgnoringDuplicate(() -> postLikeRepository.saveAndFlush(like));
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
    public FavoriteResponseDTO favoritePost(Long userId, UUID postId) {
        User user = getUserOrThrow(userId);
        Post post = getPostOrThrow(postId);

        Optional<PostFavorite> existingFavorite =
                postFavoriteRepository.findByPost_PostIdAndUser_Id(postId, userId);

        if (existingFavorite.isEmpty()) {
            PostFavorite favorite = new PostFavorite();
            favorite.setPost(post);
            favorite.setUser(user);
            saveIgnoringDuplicate(() -> postFavoriteRepository.saveAndFlush(favorite));
        }

        long favoritesCount = postFavoriteRepository.countByPost_PostId(postId);

        return new FavoriteResponseDTO(
                postId,
                true,
                favoritesCount
        );
    }

    @Transactional
    public FavoriteResponseDTO unfavoritePost(Long userId, UUID postId) {
        getUserOrThrow(userId);
        getPostOrThrow(postId);

        postFavoriteRepository.deleteByPost_PostIdAndUser_Id(postId, userId);

        long favoritesCount = postFavoriteRepository.countByPost_PostId(postId);

        return new FavoriteResponseDTO(
                postId,
                false,
                favoritesCount
        );
    }

    @Transactional
    public FavoriteResponseDTO toggleFavorite(Long userId, UUID postId) {
        boolean alreadyFavorited =
                postFavoriteRepository.existsByPost_PostIdAndUser_Id(postId, userId);

        if (alreadyFavorited) {
            return unfavoritePost(userId, postId);
        }

        return favoritePost(userId, postId);
    }

    @Transactional(readOnly = true)
    public Page<PostResponseDTO> getFavoritePosts(Long currentUserId, Pageable pageable) {
        getUserOrThrow(currentUserId);
        return buildPostResponsePage(
                postFavoriteRepository.findFavoritePostsByUserId(currentUserId, pageable),
                currentUserId
        );
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
            if (!parentComment.getPost().getPostId().equals(postId)) {
                throw new IllegalArgumentException("Parent comment belongs to another post");
            }
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
        Post post = getPostOrThrow(postId);
        getUserOrThrow(currentUserId);

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

    @Transactional(readOnly = true)
    public Page<CommentResponseDTO> getCommentReplies(
            Long currentUserId,
            UUID commentId,
            Pageable pageable
    ) {
        PostComment parentComment = getCommentOrThrow(commentId);
        getUserOrThrow(currentUserId);

        return postCommentRepository
                .findByParentComment_CommentIdOrderByCreatedAtAsc(commentId, pageable)
                .map(comment -> buildCommentResponse(comment, currentUserId));
    }

    @Transactional
    public CommentResponseDTO updateComment(Long userId, UUID commentId, UpdateCommentDTO dto) {
        PostComment comment = getCommentOrThrow(commentId);
        getUserOrThrow(userId);

        if (!comment.getUser().getId().equals(userId)) {
            throw new SecurityException("You are not allowed to update this comment");
        }

        comment.setContent(dto.content());
        comment.setUpdatedAt(LocalDateTime.now());

        PostComment updatedComment = postCommentRepository.save(comment);

        return buildCommentResponse(updatedComment, userId);
    }

    @Transactional
    public void deleteComment(Long userId, UUID commentId) {
        PostComment comment = getCommentOrThrow(commentId);
        getUserOrThrow(userId);

        boolean isCommentOwner = comment.getUser().getId().equals(userId);
        boolean isPostOwner = comment.getPost().getOwner().getId().equals(userId);

        if (!isCommentOwner && !isPostOwner) {
            throw new SecurityException("You are not allowed to delete this comment");
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
            saveIgnoringDuplicate(() -> commentLikeRepository.saveAndFlush(like));
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
        getUserOrThrow(currentUserId);

        Page<Post> hashtagPosts = postHashtagRepository.findPostsByHashtagName(normalized, pageable);
        return buildPostResponsePage(hashtagPosts, currentUserId);
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

    @Transactional
    public void markPostSeen(Long userId, UUID postId) {
        User user = getUserOrThrow(userId);
        Post post = getPostOrThrow(postId);

        if (!postImpressionRepository.existsByPost_PostIdAndUser_Id(postId, userId)) {
            PostImpression impression = new PostImpression();
            impression.setUser(user);
            impression.setPost(post);
            saveIgnoringDuplicate(() -> postImpressionRepository.saveAndFlush(impression));
        }
    }

    @Transactional
    public PostMediaUploadResponseDTO uploadPostMedia(
            byte[] fileBytes,
            String filename,
            String contentType,
            String attachmentType
    ) {
        try {
            MediaUploadResult upload = mediaUploadService.upload(new MediaUploadRequest(
                    fileBytes,
                    filename,
                    contentType,
                    ImageVariant.POST
            ));

            return new PostMediaUploadResponseDTO(
                    normalizeAttachmentType(attachmentType, upload.contentType()),
                    upload.url(),
                    upload.filename(),
                    upload.contentType()
            );
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Attachment upload was interrupted", e);
        } catch (IOException e) {
            throw new RuntimeException("Attachment upload failed", e);
        }
    }

    private PostResponseDTO buildPostResponse(Post post, Long currentUserId) {
        return buildPostResponses(List.of(post), currentUserId).get(0);
    }

    private Page<PostResponseDTO> buildPostResponsePage(Page<Post> posts, Long currentUserId) {
        return new PageImpl<>(
                buildPostResponses(posts.getContent(), currentUserId),
                posts.getPageable(),
                posts.getTotalElements()
        );
    }

    private List<PostResponseDTO> buildPostResponses(List<Post> posts, Long currentUserId) {
        if (posts == null || posts.isEmpty()) {
            return List.of();
        }

        List<UUID> postIds = posts.stream()
                .map(Post::getPostId)
                .toList();

        Map<UUID, List<PostAttachment>> attachmentsByPostId = postAttachmentRepository
                .findByPost_PostIdIn(postIds)
                .stream()
                .collect(Collectors.groupingBy(attachment -> attachment.getPost().getPostId()));

        Map<UUID, List<String>> hashtagsByPostId = postHashtagRepository
                .findByPost_PostIdIn(postIds)
                .stream()
                .collect(Collectors.groupingBy(
                        postHashtag -> postHashtag.getPost().getPostId(),
                        Collectors.mapping(postHashtag -> postHashtag.getHashtag().getName(), Collectors.toList())
                ));

        Map<UUID, Long> likesByPostId = countsByPostId(postLikeRepository.countByPostIds(postIds));
        Map<UUID, Long> commentsByPostId = countsByPostId(postCommentRepository.countByPostIds(postIds));

        Set<UUID> likedPostIds = currentUserId == null
                ? Set.of()
                : new HashSet<>(postLikeRepository.findLikedPostIdsByUserIdAndPostIds(currentUserId, postIds));
        Set<UUID> favoritedPostIds = currentUserId == null
                ? Set.of()
                : new HashSet<>(postFavoriteRepository.findFavoritedPostIdsByUserIdAndPostIds(currentUserId, postIds));
        Set<UUID> seenPostIds = currentUserId == null
                ? Set.of()
                : new HashSet<>(postImpressionRepository.findSeenPostIdsByUserIdAndPostIds(currentUserId, postIds));

        return posts.stream()
                .map(post -> {
                    UUID postId = post.getPostId();
                    return PostMapper.toPostResponseDTO(
                            post,
                            attachmentsByPostId.getOrDefault(postId, List.of()),
                            hashtagsByPostId.getOrDefault(postId, List.of()),
                            likesByPostId.getOrDefault(postId, 0L),
                            commentsByPostId.getOrDefault(postId, 0L),
                            likedPostIds.contains(postId),
                            favoritedPostIds.contains(postId),
                            seenPostIds.contains(postId)
                    );
                })
                .toList();
    }

    private Map<UUID, Long> countsByPostId(List<PostCountView> counts) {
        return counts.stream()
                .collect(Collectors.toMap(PostCountView::getId, PostCountView::getCount));
    }

    private Page<PostResponseDTO> pageFromRankedPosts(List<Post> rankedPosts, Pageable pageable, Long currentUserId) {
        int start = Math.min((int) pageable.getOffset(), rankedPosts.size());
        int end = Math.min(start + pageable.getPageSize(), rankedPosts.size());
        List<Post> pageContent = rankedPosts.subList(start, end);

        return new PageImpl<>(
                buildPostResponses(pageContent, currentUserId),
                pageable,
                rankedPosts.size()
        );
    }

    private double feedScore(Post post, User currentUser, Set<String> followingUsernames, Set<UUID> seenPostIds) {
        double sameSchoolScore = Objects.equals(post.getOwner().getCollege(), currentUser.getCollege()) ? 40.0 : 0.0;
        double followingScore = followingUsernames.contains(post.getOwner().getUsername()) ? 20.0 : 0.0;
        double recencyScore = recencyScore(post.getCreatedAt()) * 20.0;
        double seenPenalty = seenPostIds.contains(post.getPostId()) ? 15.0 : 0.0;

        return sameSchoolScore + followingScore + recencyScore - seenPenalty;
    }

    private Set<String> followingUsernamesFor(User currentUser) {
        try {
            return new HashSet<>(followService.getFollowingUsernames(currentUser.getUsername()));
        } catch (RuntimeException ignored) {
            return Set.of();
        }
    }

    private double recencyScore(LocalDateTime createdAt) {
        if (createdAt == null) {
            return 0.0;
        }

        long hours = Math.max(0, ChronoUnit.HOURS.between(createdAt, LocalDateTime.now()));
        return Math.exp(-hours / 72.0);
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
                    .orElseGet(() -> getOrCreateHashtag(name));

            PostHashtag postHashtag = new PostHashtag();
            postHashtag.setPost(post);
            postHashtag.setHashtag(hashtag);

            saveIgnoringDuplicate(() -> postHashtagRepository.saveAndFlush(postHashtag));
        }
    }

    private Hashtag getOrCreateHashtag(String name) {
        Hashtag newHashtag = new Hashtag();
        newHashtag.setName(name);

        try {
            return hashtagRepository.saveAndFlush(newHashtag);
        } catch (DataIntegrityViolationException ignored) {
            return hashtagRepository.findByName(name)
                    .orElseThrow(() -> new IllegalStateException("Hashtag was created concurrently but could not be loaded"));
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
            throw new EntityNotFoundException("User not found with id: " + userId);
        }

        return user;
    }

    private Post getPostOrThrow(UUID postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Post not found with id: " + postId));
    }

    private PostComment getCommentOrThrow(UUID commentId) {
        return postCommentRepository.findById(commentId)
                .orElseThrow(() -> new EntityNotFoundException("Comment not found with id: " + commentId));
    }

    private void saveIgnoringDuplicate(Runnable save) {
        try {
            save.run();
        } catch (DataIntegrityViolationException ignored) {
            // A concurrent request already created the same unique relationship.
        }
    }

    private String normalizeAttachmentType(String requestedType, String contentType) {
        if (requestedType != null && !requestedType.isBlank()) {
            PostMapper.parseAttachmentType(requestedType);
            return requestedType.trim().toUpperCase();
        }

        if (mediaUploadService.isImage(contentType)) {
            return AttachmentType.IMAGE.name();
        }
        if (mediaUploadService.isVideo(contentType)) {
            return AttachmentType.VIDEO.name();
        }
        return AttachmentType.FILE.name();
    }
}

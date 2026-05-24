package com.graduation.julink.post;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.post.PostDTOs.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final AuthRepository authRepository;

    @PostMapping
    public PostResponseDTO createPost(
            Principal principal,
            @Valid @RequestBody CreatePostDTO dto
    ) {
        return postService.createPost(currentUser(principal).getId(), dto);
    }

    @GetMapping("/{postId}")
    public PostResponseDTO getPostById(
            Principal principal,
            @PathVariable UUID postId
    ) {
        return postService.getPostById(currentUser(principal).getId(), postId);
    }

    @PutMapping("/{postId}")
    public PostResponseDTO updatePost(
            Principal principal,
            @PathVariable UUID postId,
            @Valid @RequestBody UpdatePostDTO dto
    ) {
        return postService.updatePost(currentUser(principal).getId(), postId, dto);
    }

    @DeleteMapping("/{postId}")
    public void deletePost(
            Principal principal,
            @PathVariable UUID postId
    ) {
        postService.deletePost(currentUser(principal).getId(), postId);
    }

    @GetMapping("/user/{ownerId}")
    public Page<PostResponseDTO> getUserPosts(
            Principal principal,
            @PathVariable Long ownerId,
            Pageable pageable
    ) {
        return postService.getUserPosts(currentUser(principal).getId(), ownerId, pageable);
    }

    @GetMapping("/feed")
    public Page<PostResponseDTO> getHomeFeed(
            Principal principal,
            Pageable pageable
    ) {
        return postService.getHomeFeed(currentUser(principal).getId(), pageable);
    }

    @GetMapping("/recommended")
    public Page<PostResponseDTO> getRecommendedPosts(
            Principal principal,
            Pageable pageable
    ) {
        return postService.getRecommendedPosts(currentUser(principal).getId(), pageable);
    }

    @PostMapping("/{postId}/toggle-like")
    public LikeResponseDTO toggleLike(
            Principal principal,
            @PathVariable UUID postId
    ) {
        return postService.toggleLike(currentUser(principal).getId(), postId);
    }

    @PostMapping("/{postId}/like")
    public LikeResponseDTO likePost(
            Principal principal,
            @PathVariable UUID postId
    ) {
        return postService.likePost(currentUser(principal).getId(), postId);
    }

    @DeleteMapping("/{postId}/like")
    public LikeResponseDTO unlikePost(
            Principal principal,
            @PathVariable UUID postId
    ) {
        return postService.unlikePost(currentUser(principal).getId(), postId);
    }

    @PostMapping("/{postId}/comments")
    public CommentResponseDTO createComment(
            Principal principal,
            @PathVariable UUID postId,
            @Valid @RequestBody CreateCommentDTO dto
    ) {
        return postService.createComment(currentUser(principal).getId(), postId, dto);
    }

    @GetMapping("/{postId}/comments")
    public Page<CommentResponseDTO> getPostComments(
            Principal principal,
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "newest") String sortBy,
            Pageable pageable
    ) {
        return postService.getPostComments(currentUser(principal).getId(), postId, sortBy, pageable);
    }

    @GetMapping("/comments/{commentId}/replies")
    public Page<CommentResponseDTO> getCommentReplies(
            Principal principal,
            @PathVariable UUID commentId,
            Pageable pageable
    ) {
        return postService.getCommentReplies(currentUser(principal).getId(), commentId, pageable);
    }

    @PostMapping("/comments/{commentId}/toggle-like")
    public CommentLikeResponseDTO toggleCommentLike(
            Principal principal,
            @PathVariable UUID commentId
    ) {
        return postService.toggleCommentLike(currentUser(principal).getId(), commentId);
    }

    @PostMapping("/comments/{commentId}/like")
    public CommentLikeResponseDTO likeComment(
            Principal principal,
            @PathVariable UUID commentId
    ) {
        return postService.likeComment(currentUser(principal).getId(), commentId);
    }

    @DeleteMapping("/comments/{commentId}/like")
    public CommentLikeResponseDTO unlikeComment(
            Principal principal,
            @PathVariable UUID commentId
    ) {
        return postService.unlikeComment(currentUser(principal).getId(), commentId);
    }
    @PutMapping("/comments/{commentId}")
    public CommentResponseDTO updateComment(
            Principal principal,
            @PathVariable UUID commentId,
            @Valid @RequestBody UpdateCommentDTO dto
    ) {
        return postService.updateComment(currentUser(principal).getId(), commentId, dto);
    }

    @DeleteMapping("/comments/{commentId}")
    public void deleteComment(
            Principal principal,
            @PathVariable UUID commentId
    ) {
        postService.deleteComment(currentUser(principal).getId(), commentId);
    }

    @GetMapping("/hashtags/{hashtagName}")
    public Page<PostResponseDTO> getPostsByHashtag(
            Principal principal,
            @PathVariable String hashtagName,
            Pageable pageable
    ) {
        return postService.getPostsByHashtag(currentUser(principal).getId(), hashtagName, pageable);
    }

    @GetMapping("/hashtags/trending")
    public Page<HashtagResponseDTO> getTrendingHashtags(
            Pageable pageable
    ) {
        return postService.getTrendingHashtags(pageable);
    }

    private User currentUser(Principal principal) {
        return authRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new SecurityException("Authenticated user was not found"));
    }
}

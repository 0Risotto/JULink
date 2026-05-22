package com.graduation.julink.post;

import com.graduation.julink.post.PostDTOs.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public PostResponseDTO createPost(
            @RequestParam Long ownerId,
            @RequestBody CreatePostDTO dto
    ) {
        return postService.createPost(ownerId, dto);
    }

    @GetMapping("/{postId}")
    public PostResponseDTO getPostById(
            @RequestParam Long currentUserId,
            @PathVariable UUID postId
    ) {
        return postService.getPostById(currentUserId, postId);
    }

    @PutMapping("/{postId}")
    public PostResponseDTO updatePost(
            @RequestParam Long ownerId,
            @PathVariable UUID postId,
            @RequestBody UpdatePostDTO dto
    ) {
        return postService.updatePost(ownerId, postId, dto);
    }

    @DeleteMapping("/{postId}")
    public void deletePost(
            @RequestParam Long ownerId,
            @PathVariable UUID postId
    ) {
        postService.deletePost(ownerId, postId);
    }

    @GetMapping("/user/{ownerId}")
    public Page<PostResponseDTO> getUserPosts(
            @RequestParam Long currentUserId,
            @PathVariable Long ownerId,
            Pageable pageable
    ) {
        return postService.getUserPosts(currentUserId, ownerId, pageable);
    }

    @GetMapping("/feed")
    public Page<PostResponseDTO> getHomeFeed(
            @RequestParam Long currentUserId,
            Pageable pageable
    ) {
        return postService.getHomeFeed(currentUserId, pageable);
    }

    @GetMapping("/recommended")
    public Page<PostResponseDTO> getRecommendedPosts(
            @RequestParam Long currentUserId,
            Pageable pageable
    ) {
        return postService.getRecommendedPosts(currentUserId, pageable);
    }

    @PostMapping("/{postId}/toggle-like")
    public LikeResponseDTO toggleLike(
            @RequestParam Long userId,
            @PathVariable UUID postId
    ) {
        return postService.toggleLike(userId, postId);
    }

    @PostMapping("/{postId}/like")
    public LikeResponseDTO likePost(
            @RequestParam Long userId,
            @PathVariable UUID postId
    ) {
        return postService.likePost(userId, postId);
    }

    @DeleteMapping("/{postId}/like")
    public LikeResponseDTO unlikePost(
            @RequestParam Long userId,
            @PathVariable UUID postId
    ) {
        return postService.unlikePost(userId, postId);
    }

    @PostMapping("/{postId}/comments")
    public CommentResponseDTO createComment(
            @RequestParam Long userId,
            @PathVariable UUID postId,
            @RequestBody CreateCommentDTO dto
    ) {
        return postService.createComment(userId, postId, dto);
    }

    @GetMapping("/{postId}/comments")
    public Page<CommentResponseDTO> getPostComments(
            @RequestParam Long currentUserId,
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "newest") String sortBy,
            Pageable pageable
    ) {
        return postService.getPostComments(currentUserId, postId, sortBy, pageable);
    }

    @PostMapping("/comments/{commentId}/toggle-like")
    public CommentLikeResponseDTO toggleCommentLike(
            @RequestParam Long userId,
            @PathVariable UUID commentId
    ) {
        return postService.toggleCommentLike(userId, commentId);
    }

    @PostMapping("/comments/{commentId}/like")
    public CommentLikeResponseDTO likeComment(
            @RequestParam Long userId,
            @PathVariable UUID commentId
    ) {
        return postService.likeComment(userId, commentId);
    }

    @DeleteMapping("/comments/{commentId}/like")
    public CommentLikeResponseDTO unlikeComment(
            @RequestParam Long userId,
            @PathVariable UUID commentId
    ) {
        return postService.unlikeComment(userId, commentId);
    }
    @PutMapping("/comments/{commentId}")
    public CommentResponseDTO updateComment(
            @RequestParam Long userId,
            @PathVariable UUID commentId,
            @RequestBody UpdateCommentDTO dto
    ) {
        return postService.updateComment(userId, commentId, dto);
    }

    @DeleteMapping("/comments/{commentId}")
    public void deleteComment(
            @RequestParam Long userId,
            @PathVariable UUID commentId
    ) {
        postService.deleteComment(userId, commentId);
    }

    @GetMapping("/hashtags/{hashtagName}")
    public Page<PostResponseDTO> getPostsByHashtag(
            @RequestParam Long currentUserId,
            @PathVariable String hashtagName,
            Pageable pageable
    ) {
        return postService.getPostsByHashtag(currentUserId, hashtagName, pageable);
    }

    @GetMapping("/hashtags/trending")
    public Page<HashtagResponseDTO> getTrendingHashtags(
            Pageable pageable
    ) {
        return postService.getTrendingHashtags(pageable);
    }
}
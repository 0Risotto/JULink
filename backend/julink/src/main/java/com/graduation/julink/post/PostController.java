package com.graduation.julink.post;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.post.PostDTOs.*;
import com.graduation.julink.report.ReportDTOs.ReportMessageRequest;
import com.graduation.julink.report.ReportDTOs.ReportResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
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

    @GetMapping("/{postId}/share-link")
    public PostShareLinkDTO getPostShareLink(
            Principal principal,
            @PathVariable UUID postId
    ) {
        return postService.getPostShareLink(currentUser(principal).getId(), postId);
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

    @GetMapping("/user/{username}")
    public Page<PostResponseDTO> getUserPosts(
            Principal principal,
            @PathVariable String username,
            Pageable pageable
    ) {
        return postService.getUserPosts(currentUser(principal).getId(), username, pageable);
    }

    @GetMapping("/feed")
    public Page<PostResponseDTO> getHomeFeed(
            Principal principal,
            Pageable pageable
    ) {
        return postService.getHomeFeed(currentUser(principal).getId(), pageable);
    }

    @GetMapping("/favorites")
    public Page<PostResponseDTO> getFavoritePosts(
            Principal principal,
            Pageable pageable
    ) {
        return postService.getFavoritePosts(currentUser(principal).getId(), pageable);
    }

    @PostMapping("/{postId}/toggle-like")
    public LikeResponseDTO toggleLike(
            Principal principal,
            @PathVariable UUID postId
    ) {
        return postService.toggleLike(currentUser(principal).getId(), postId);
    }

//    @PostMapping("/{postId}/like")
//    public LikeResponseDTO likePost(
//            Principal principal,
//            @PathVariable UUID postId
//    ) {
//        return postService.likePost(currentUser(principal).getId(), postId);
//    }
//
//    @DeleteMapping("/{postId}/like")
//    public LikeResponseDTO unlikePost(
//            Principal principal,
//            @PathVariable UUID postId
//    ) {
//        return postService.unlikePost(currentUser(principal).getId(), postId);
//    }

    @PostMapping("/{postId}/toggle-favorite")
    public FavoriteResponseDTO toggleFavorite(
            Principal principal,
            @PathVariable UUID postId
    ) {
        return postService.toggleFavorite(currentUser(principal).getId(), postId);
    }

    @PostMapping("/{postId}/favorite")
    public FavoriteResponseDTO favoritePost(
            Principal principal,
            @PathVariable UUID postId
    ) {
        return postService.favoritePost(currentUser(principal).getId(), postId);
    }

    @DeleteMapping("/{postId}/favorite")
    public FavoriteResponseDTO unfavoritePost(
            Principal principal,
            @PathVariable UUID postId
    ) {
        return postService.unfavoritePost(currentUser(principal).getId(), postId);
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

    @PostMapping("/{postId}/impression")
    public void markPostSeen(
            Principal principal,
            @PathVariable UUID postId
    ) {
        postService.markPostSeen(currentUser(principal).getId(), postId);
    }

    @PostMapping("/{postId}/report")
    public ReportResponse reportPost(
            Principal principal,
            @PathVariable UUID postId,
            @Valid @RequestBody ReportMessageRequest dto
    ) {
        return postService.reportPost(currentUser(principal).getId(), postId, dto);
    }

    @PostMapping("/media")
    public List<PostMediaUploadResponseDTO> uploadPostMedia(
            Principal principal,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "attachmentType", required = false) String attachmentType
    ) throws IOException {
        currentUser(principal);

        List<MultipartFile> uploadFiles = new ArrayList<>();
        if (files != null) {
            uploadFiles.addAll(files);
        }
        if (file != null) {
            uploadFiles.add(file);
        }
        if (uploadFiles.isEmpty()) {
            throw new IllegalArgumentException("At least one file is required");
        }
        if (uploadFiles.size() > 10) {
            throw new IllegalArgumentException("A post can include at most 10 attachments");
        }

        List<PostMediaUploadResponseDTO> uploads = new ArrayList<>();
        for (MultipartFile uploadFile : uploadFiles) {
            uploads.add(postService.uploadPostMedia(
                    uploadFile.getBytes(),
                    uploadFile.getOriginalFilename(),
                    uploadFile.getContentType(),
                    attachmentType
            ));
        }

        return uploads;
    }

    private User currentUser(Principal principal) {
        return authRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new SecurityException("Authenticated user was not found"));
    }
}

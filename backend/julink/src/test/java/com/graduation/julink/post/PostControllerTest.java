package com.graduation.julink.post;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.post.PostDTOs.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostControllerTest {

    @Mock
    private PostService postService;

    @Mock
    private AuthRepository authRepository;

    @Mock
    private Principal principal;

    @InjectMocks
    private PostController postController;

    private AuthEntities.User user;
    private String email = "test@ju.edu.jo";

    @BeforeEach
    void setUp() {
        user = new AuthEntities.User();
        user.setId(101L);
        user.setEmail(email);
    }

    private void mockPrincipal() {
        when(principal.getName()).thenReturn(email);
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
    }

    @Test
    void createPost_Success() {
        mockPrincipal();
        CreatePostDTO req = new CreatePostDTO("content", Collections.emptyList());
        PostResponseDTO resp = new PostResponseDTO(UUID.randomUUID(), 101L, "user1", "First", "Last", "url", "content", Collections.emptyList(), Collections.emptyList(), 0L, 0L, false, false, false, null, null);
        
        when(postService.createPost(101L, req)).thenReturn(resp);

        PostResponseDTO response = postController.createPost(principal, req);

        assertEquals(resp, response);
    }

    @Test
    void getPostById_Success() {
        mockPrincipal();
        UUID postId = UUID.randomUUID();
        PostResponseDTO resp = new PostResponseDTO(postId, 101L, "user1", "First", "Last", "url", "content", Collections.emptyList(), Collections.emptyList(), 0L, 0L, false, false, false, null, null);
        
        when(postService.getPostById(101L, postId)).thenReturn(resp);

        PostResponseDTO response = postController.getPostById(principal, postId);

        assertEquals(resp, response);
    }

    @Test
    void deletePost_Success() {
        mockPrincipal();
        UUID postId = UUID.randomUUID();
        doNothing().when(postService).deletePost(101L, postId);

        postController.deletePost(principal, postId);

        verify(postService, times(1)).deletePost(101L, postId);
    }

    @Test
    void getUserPosts_Success() {
        mockPrincipal();
        Page<PostResponseDTO> page = new PageImpl<>(Collections.emptyList());
        when(postService.getUserPosts(eq(101L), eq("targetuser"), any(Pageable.class))).thenReturn(page);

        Page<PostResponseDTO> response = postController.getUserPosts(principal, "targetuser", Pageable.unpaged());

        assertEquals(page, response);
    }

    @Test
    void toggleLike_Success() {
        mockPrincipal();
        UUID postId = UUID.randomUUID();
        LikeResponseDTO resp = new LikeResponseDTO(postId, true, 1L);
        when(postService.toggleLike(101L, postId)).thenReturn(resp);

        LikeResponseDTO response = postController.toggleLike(principal, postId);

        assertEquals(resp, response);
    }

    @Test
    void toggleFavorite_Success() {
        mockPrincipal();
        UUID postId = UUID.randomUUID();
        FavoriteResponseDTO resp = new FavoriteResponseDTO(postId, true, 1L);
        when(postService.toggleFavorite(101L, postId)).thenReturn(resp);

        FavoriteResponseDTO response = postController.toggleFavorite(principal, postId);

        assertEquals(resp, response);
    }

    @Test
    void favoritePost_Success() {
        mockPrincipal();
        UUID postId = UUID.randomUUID();
        FavoriteResponseDTO resp = new FavoriteResponseDTO(postId, true, 1L);
        when(postService.favoritePost(101L, postId)).thenReturn(resp);

        FavoriteResponseDTO response = postController.favoritePost(principal, postId);

        assertEquals(resp, response);
    }

    @Test
    void unfavoritePost_Success() {
        mockPrincipal();
        UUID postId = UUID.randomUUID();
        FavoriteResponseDTO resp = new FavoriteResponseDTO(postId, false, 0L);
        when(postService.unfavoritePost(101L, postId)).thenReturn(resp);

        FavoriteResponseDTO response = postController.unfavoritePost(principal, postId);

        assertEquals(resp, response);
    }

    @Test
    void getFavoritePosts_Success() {
        mockPrincipal();
        Page<PostResponseDTO> page = new PageImpl<>(Collections.emptyList());
        when(postService.getFavoritePosts(eq(101L), any(Pageable.class))).thenReturn(page);

        Page<PostResponseDTO> response = postController.getFavoritePosts(principal, Pageable.unpaged());

        assertEquals(page, response);
    }

    @Test
    void reportPost_Success() {
        mockPrincipal();
        UUID postId = UUID.randomUUID();
        ReportPostDTO req = new ReportPostDTO("Inappropriate post");
        ReportResponseDTO resp = new ReportResponseDTO(
                "success",
                java.time.LocalDateTime.now(),
                101L,
                "user1",
                "POST",
                postId,
                "Inappropriate post"
        );
        when(postService.reportPost(101L, postId, req)).thenReturn(resp);

        ReportResponseDTO response = postController.reportPost(principal, postId, req);

        assertEquals(resp, response);
    }
}

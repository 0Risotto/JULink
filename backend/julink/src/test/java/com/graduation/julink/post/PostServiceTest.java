package com.graduation.julink.post;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.follow.FollowService;
import com.graduation.julink.post.PostDTOs.*;
import com.graduation.julink.post.PostEntities.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock private PostRepository postRepository;
    @Mock private PostAttachmentRepository postAttachmentRepository;
    @Mock private HashtagRepository hashtagRepository;
    @Mock private PostHashtagRepository postHashtagRepository;
    @Mock private PostLikeRepository postLikeRepository;
    @Mock private PostCommentRepository postCommentRepository;
    @Mock private CommentLikeRepository commentLikeRepository;
    @Mock private FollowService followService;
    @Mock private EntityManager entityManager;

    @InjectMocks
    private PostService postService;

    private User user;
    private Post post;
    private UUID postId;

    @BeforeEach
    void setUp() {
        org.springframework.test.util.ReflectionTestUtils.setField(postService, "entityManager", entityManager);

        user = new User();
        user.setId(101L);
        user.setUsername("user1");
        user.setFirstName("First");
        user.setLastName("Last");

        postId = UUID.randomUUID();
        post = new Post();
        post.setPostId(postId);
        post.setOwner(user);
        post.setVisibility(PostVisibility.PUBLIC);
        post.setDescription("Test description #cool");
    }

    @Test
    void createPost_Success() {
        CreatePostDTO req = new CreatePostDTO("Test description #cool", "PUBLIC", Collections.emptyList());

        when(entityManager.find(User.class, 101L)).thenReturn(user);
        when(postRepository.save(any(Post.class))).thenReturn(post);

        PostResponseDTO response = postService.createPost(101L, req);

        assertNotNull(response);
        assertEquals(postId, response.postId());
        verify(postRepository, times(1)).save(any(Post.class));
    }

    @Test
    void getPostById_Success() {
        when(entityManager.find(User.class, 101L)).thenReturn(user);
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        PostResponseDTO response = postService.getPostById(101L, postId);

        assertNotNull(response);
        assertEquals(postId, response.postId());
    }

    @Test
    void getPostById_Unauthorized_ThrowsException() {
        User otherUser = new User();
        otherUser.setId(102L);
        otherUser.setUsername("user2");

        post.setVisibility(PostVisibility.FOLLOWERS_ONLY);

        when(entityManager.find(User.class, 102L)).thenReturn(otherUser);
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(followService.isFollowing("user2", "user1")).thenReturn(false);

        SecurityException exception = assertThrows(SecurityException.class, 
                () -> postService.getPostById(102L, postId));
        assertEquals("You are not allowed to view this post", exception.getMessage());
    }

    @Test
    void deletePost_Success() {
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        postService.deletePost(101L, postId);

        verify(postRepository, times(1)).delete(post);
    }

    @Test
    void likePost_Success() {
        when(entityManager.find(User.class, 101L)).thenReturn(user);
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(postLikeRepository.findByPost_PostIdAndUser_Id(postId, 101L)).thenReturn(Optional.empty());
        when(postLikeRepository.countByPost_PostId(postId)).thenReturn(1L);

        LikeResponseDTO response = postService.likePost(101L, postId);

        assertTrue(response.liked());
        assertEquals(1L, response.likesCount());
        verify(postLikeRepository, times(1)).save(any(PostLike.class));
    }
}

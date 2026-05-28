package com.graduation.julink.post;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.block.BlockService;
import com.graduation.julink.common.media.MediaUploadService;
import com.graduation.julink.follow.FollowService;
import com.graduation.julink.notification.NotificationService;
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

import java.nio.file.Files;
import java.nio.file.Path;
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
    @Mock private PostFavoriteRepository postFavoriteRepository;
    @Mock private PostCommentRepository postCommentRepository;
    @Mock private CommentLikeRepository commentLikeRepository;
    @Mock private PostImpressionRepository postImpressionRepository;
    @Mock private AuthRepository authRepository;
    @Mock private FollowService followService;
    @Mock private MediaUploadService mediaUploadService;
    @Mock private NotificationService notificationService;
    @Mock private BlockService blockService;
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
        post.setDescription("Test description #cool");

        lenient().when(postAttachmentRepository.findByPost_PostIdIn(anyCollection())).thenReturn(Collections.emptyList());
        lenient().when(postHashtagRepository.findByPost_PostIdIn(anyCollection())).thenReturn(Collections.emptyList());
        lenient().when(postLikeRepository.countByPostIds(anyCollection())).thenReturn(Collections.emptyList());
        lenient().when(postCommentRepository.countByPostIds(anyCollection())).thenReturn(Collections.emptyList());
        lenient().when(postLikeRepository.findLikedPostIdsByUserIdAndPostIds(anyLong(), anyCollection())).thenReturn(Collections.emptyList());
        lenient().when(postFavoriteRepository.findFavoritedPostIdsByUserIdAndPostIds(anyLong(), anyCollection())).thenReturn(Collections.emptyList());
        lenient().when(postImpressionRepository.findSeenPostIdsByUserIdAndPostIds(anyLong(), anyCollection())).thenReturn(Collections.emptyList());
        lenient().when(hashtagRepository.findByName(anyString())).thenReturn(Optional.empty());
        lenient().when(hashtagRepository.saveAndFlush(any(Hashtag.class))).thenAnswer(invocation -> invocation.getArgument(0));
        lenient().when(postHashtagRepository.saveAndFlush(any(PostHashtag.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void createPost_Success() {
        CreatePostDTO req = new CreatePostDTO("Test description #cool", Collections.emptyList());

        when(entityManager.find(User.class, 101L)).thenReturn(user);
        when(postRepository.save(any(Post.class))).thenReturn(post);

        PostResponseDTO response = postService.createPost(101L, req);

        assertNotNull(response);
        assertEquals(postId, response.postId());
        verify(postRepository, times(1)).save(any(Post.class));
    }

    @Test
    void getPostById_Success() {
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        PostResponseDTO response = postService.getPostById(101L, postId);

        assertNotNull(response);
        assertEquals(postId, response.postId());
    }

    @Test
    void getPostById_PublicPostsAreVisible() {
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        PostResponseDTO response = postService.getPostById(102L, postId);

        assertEquals(postId, response.postId());
    }

    @Test
    void updatePost_SameHashtag_ReplacesExistingHashtagsBeforeSaving() {
        UpdatePostDTO req = new UpdatePostDTO("Test description #cool", null);

        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(postRepository.save(post)).thenReturn(post);

        PostResponseDTO response = postService.updatePost(101L, postId, req);

        assertEquals(postId, response.postId());
        verify(postHashtagRepository).deleteByPost_PostId(postId);
        verify(postHashtagRepository).saveAndFlush(any(PostHashtag.class));
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
        verify(postLikeRepository, times(1)).saveAndFlush(any(PostLike.class));
    }

    @Test
    void favoritePost_Success() {
        when(entityManager.find(User.class, 101L)).thenReturn(user);
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(postFavoriteRepository.findByPost_PostIdAndUser_Id(postId, 101L)).thenReturn(Optional.empty());
        when(postFavoriteRepository.countByPost_PostId(postId)).thenReturn(1L);

        FavoriteResponseDTO response = postService.favoritePost(101L, postId);

        assertTrue(response.favorited());
        assertEquals(1L, response.favoritesCount());
        verify(postFavoriteRepository, times(1)).saveAndFlush(any(PostFavorite.class));
    }

    @Test
    void unfavoritePost_Success() {
        when(entityManager.find(User.class, 101L)).thenReturn(user);
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(postFavoriteRepository.countByPost_PostId(postId)).thenReturn(0L);

        FavoriteResponseDTO response = postService.unfavoritePost(101L, postId);

        assertFalse(response.favorited());
        assertEquals(0L, response.favoritesCount());
        verify(postFavoriteRepository, times(1)).deleteByPost_PostIdAndUser_Id(postId, 101L);
    }

    @Test
    void toggleFavorite_WhenAlreadyFavorited_Unfavorites() {
        when(postFavoriteRepository.existsByPost_PostIdAndUser_Id(postId, 101L)).thenReturn(true);
        when(entityManager.find(User.class, 101L)).thenReturn(user);
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(postFavoriteRepository.countByPost_PostId(postId)).thenReturn(0L);

        FavoriteResponseDTO response = postService.toggleFavorite(101L, postId);

        assertFalse(response.favorited());
        verify(postFavoriteRepository, times(1)).deleteByPost_PostIdAndUser_Id(postId, 101L);
    }

    @Test
    void getFavoritePosts_Success() {
        when(entityManager.find(User.class, 101L)).thenReturn(user);
        when(postFavoriteRepository.findFavoritePostsByUserId(eq(101L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.singletonList(post)));

        Page<PostResponseDTO> response = postService.getFavoritePosts(101L, Pageable.unpaged());

        assertEquals(1, response.getContent().size());
        assertEquals(postId, response.getContent().get(0).postId());
    }

    @Test
    void reportPost_WritesReportEntry() throws Exception {
        Path reportsFile = Files.createTempFile("julink-reports", ".txt");
        org.springframework.test.util.ReflectionTestUtils.setField(
                postService,
                "reportsPath",
                reportsFile.toString()
        );
        ReportPostDTO req = new ReportPostDTO("Spam post\nwith newline");

        when(entityManager.find(User.class, 101L)).thenReturn(user);
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        ReportResponseDTO response = postService.reportPost(101L, postId, req);
        String reportContents = Files.readString(reportsFile);

        assertEquals("success", response.status());
        assertEquals(101L, response.reporterId());
        assertEquals("user1", response.reporterUsername());
        assertEquals("POST", response.reportedType());
        assertEquals(postId, response.reportedId());
        assertEquals("Spam post\nwith newline", response.message());
        assertTrue(reportContents.contains("reporterId=101"));
        assertTrue(reportContents.contains("reporterUsername=user1"));
        assertTrue(reportContents.contains("reportedType=POST"));
        assertTrue(reportContents.contains("reportedId=" + postId));
        assertTrue(reportContents.contains("message=Spam post with newline"));
    }
}

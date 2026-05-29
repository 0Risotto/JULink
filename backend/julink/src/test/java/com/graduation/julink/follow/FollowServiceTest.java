package com.graduation.julink.follow;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.block.BlockService;
import com.graduation.julink.notification.NotificationService;
import com.graduation.julink.post.PostEntities.Post;
import com.graduation.julink.post.PostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FollowServiceTest {

    @Mock
    private FollowRepository followRepository;

    @Mock
    private AuthRepository authRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private BlockService blockService;

    @Mock
    private PostRepository postRepository;

    @InjectMocks
    private FollowService followService;

    @Test
    void followUser_Success() {
        when(authRepository.existsByUsername("user1")).thenReturn(true);
        when(authRepository.existsByUsername("user2")).thenReturn(true);
        when(followRepository.isFollowing("user1", "user2")).thenReturn(false);

        followService.followUser("user1", "user2");

        verify(followRepository, times(1)).follow("user1", "user2");
    }

    @Test
    void followUser_ThrowsExceptionWhenSameUser() {
        when(authRepository.existsByUsername("user1")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
                () -> followService.followUser("user1", "user1"));
        assertEquals("Cannot follow yourself", exception.getMessage());
    }

    @Test
    void unfollowUser_Success() {
        when(followRepository.isFollowing("user1", "user2")).thenReturn(true);

        followService.unfollowUser("user1", "user2");

        verify(followRepository, times(1)).unfollow("user1", "user2");
    }

    @Test
    void getFollowers_Success() {
        when(authRepository.existsByUsername("user1")).thenReturn(true);
        Page<String> usernames = new PageImpl<>(List.of("user2"));
        when(followRepository.getFollowers(eq("user1"), any(Pageable.class))).thenReturn(usernames);

        User user2 = new User();
        user2.setUsername("user2");
        user2.setFirstName("First");
        user2.setLastName("Last");
        when(authRepository.findByUsername("user2")).thenReturn(Optional.of(user2));

        Page<FollowDTOs.FollowerListDto> result = followService.getFollowers("user1", Pageable.unpaged());

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("user2", result.getContent().get(0).username());
    }

    @Test
    void isFollowing_ReturnsTrue() {
        when(followRepository.isFollowing("user1", "user2")).thenReturn(true);
        assertTrue(followService.isFollowing("user1", "user2"));
    }

    @Test
    void isMutual_ReturnsTrue() {
        when(followRepository.isMutual("user1", "user2")).thenReturn(true);
        assertTrue(followService.isMutual("user1", "user2"));
    }

    @Test
    void getSuggestions_UsesRecentPostOwnersAndDoesNotUseJaccard() {
        User user1 = user(1L, "user1", "Engineering");
        User user2 = user(2L, "user2", "Engineering");
        User user3 = user(3L, "user3", "Science");

        when(authRepository.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(followRepository.getFollowingUsernames("user1")).thenReturn(List.of());
        when(blockService.blockedUserIdsFor(1L)).thenReturn(Set.of());
        when(postRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(
                post(user2, 4),
                post(user2, 3),
                post(user3, 2)
        )));
        when(postRepository.findSeenPostIdsByUserIdAndPostIds(eq(1L), any())).thenReturn(List.of());

        List<FollowDTOs.FollowerListDto> result = followService.getSuggestions("user1");

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals("user2", result.get(0).username());
        assertEquals("user3", result.get(1).username());
        verify(postRepository).findAllByOrderByCreatedAtDesc(any(Pageable.class));
    }

    @Test
    void getSuggestions_ExcludesCurrentFollowedAndBlockedUsers() {
        User user1 = user(1L, "user1", "Engineering");
        User followed = user(2L, "followed", "Engineering");
        User blocked = user(3L, "blocked", "Engineering");
        User suggested = user(4L, "suggested", "Engineering");

        when(authRepository.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(followRepository.getFollowingUsernames("user1")).thenReturn(List.of("followed"));
        when(blockService.blockedUserIdsFor(1L)).thenReturn(Set.of(3L));
        when(postRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(
                post(user1, 5),
                post(followed, 4),
                post(blocked, 3),
                post(suggested, 2)
        )));
        when(postRepository.findSeenPostIdsByUserIdAndPostIds(eq(1L), any())).thenReturn(List.of());

        List<FollowDTOs.FollowerListDto> result = followService.getSuggestions("user1");

        assertEquals(1, result.size());
        assertEquals("suggested", result.get(0).username());
    }

    @Test
    void getSuggestions_SeenPostsArePenalizedButStillEligible() {
        User user1 = user(1L, "user1", "Engineering");
        User seenOwner = user(2L, "seenOwner", "Engineering");
        Post seenPost = post(seenOwner, 2);

        when(authRepository.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(followRepository.getFollowingUsernames("user1")).thenReturn(List.of());
        when(blockService.blockedUserIdsFor(1L)).thenReturn(Set.of());
        when(postRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(seenPost)));
        when(postRepository.findSeenPostIdsByUserIdAndPostIds(eq(1L), any())).thenReturn(List.of(seenPost.getPostId()));

        List<FollowDTOs.FollowerListDto> result = followService.getSuggestions("user1");

        assertEquals(1, result.size());
        assertEquals("seenOwner", result.get(0).username());
    }

    @Test
    void getSuggestions_ReturnsFewerThanLimitWhenPoolIsSmall() {
        User user1 = user(1L, "user1", "Engineering");

        when(authRepository.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(followRepository.getFollowingUsernames("user1")).thenReturn(List.of());
        when(blockService.blockedUserIdsFor(1L)).thenReturn(Set.of());
        when(postRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class))).thenReturn(Page.empty());

        List<FollowDTOs.FollowerListDto> result = followService.getSuggestions("user1");

        assertTrue(result.isEmpty());
    }

    private User user(Long id, String username, String college) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setFirstName("First");
        user.setLastName("Last");
        user.setCollege(college);
        return user;
    }

    private Post post(User owner, int hoursAgo) {
        Post post = new Post();
        post.setPostId(UUID.randomUUID());
        post.setOwner(owner);
        post.setDescription("post");
        post.setCreatedAt(LocalDateTime.now().minusHours(hoursAgo));
        return post;
    }
}

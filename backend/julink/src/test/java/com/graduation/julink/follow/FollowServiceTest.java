package com.graduation.julink.follow;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

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
    void getSuggestions_Success() {
        when(followRepository.fetchSuggestions("user1")).thenReturn(List.of("user2"));

        User user2 = new User();
        user2.setUsername("user2");
        user2.setFirstName("First");
        user2.setLastName("Last");
        when(authRepository.findByUsernameIn(any())).thenReturn(List.of(user2));

        List<FollowDTOs.FollowerListDto> result = followService.getSuggestions("user1");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("user2", result.get(0).username());
    }
}

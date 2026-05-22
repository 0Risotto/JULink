package com.graduation.julink.follow;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
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
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FollowControllerTest {

    @Mock
    private FollowService followService;

    @Mock
    private AuthRepository authRepository;

    @Mock
    private Principal principal;

    @InjectMocks
    private FollowController followController;

    private AuthEntities.User user;
    private String email = "test@ju.edu.jo";
    private String username = "testuser";

    @BeforeEach
    void setUp() {
        user = new AuthEntities.User();
        user.setEmail(email);
        user.setUsername(username);
    }

    private void mockPrincipal() {
        when(principal.getName()).thenReturn(email);
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
    }

    @Test
    void followUser_Success() {
        mockPrincipal();
        doNothing().when(followService).followUser(username, "otheruser");

        Map<String, Object> response = followController.followUser(principal, "otheruser");

        assertEquals("success", response.get("status"));
        assertEquals("You are now following otheruser", response.get("message"));
    }

    @Test
    void unfollowUser_Success() {
        mockPrincipal();
        doNothing().when(followService).unfollowUser(username, "otheruser");

        Map<String, Object> response = followController.unfollowUser(principal, "otheruser");

        assertEquals("success", response.get("status"));
        assertEquals("You have unfollowed otheruser", response.get("message"));
    }

    @Test
    void getFollowers_Success() {
        Page<FollowDTOs.FollowerListDto> page = new PageImpl<>(Collections.emptyList());
        when(followService.getFollowers(eq("otheruser"), any(Pageable.class))).thenReturn(page);

        Map<String, Object> response = followController.getFollowers(principal, "otheruser", Pageable.unpaged());

        assertEquals("success", response.get("status"));
    }

    @Test
    void getFollowings_Success() {
        Page<FollowDTOs.FollowerListDto> page = new PageImpl<>(Collections.emptyList());
        when(followService.getFollowings(eq("otheruser"), any(Pageable.class))).thenReturn(page);

        Map<String, Object> response = followController.getFollowings(principal, "otheruser", Pageable.unpaged());

        assertEquals("success", response.get("status"));
    }

    @Test
    void isFollowing_Success() {
        mockPrincipal();
        when(followService.isFollowing(username, "otheruser")).thenReturn(true);

        Map<String, Object> response = followController.isFollowing(principal, "otheruser");

        assertEquals("success", response.get("status"));
        assertEquals(true, response.get("following"));
    }

    @Test
    void isMutual_Success() {
        mockPrincipal();
        when(followService.isMutual(username, "otheruser")).thenReturn(true);

        Map<String, Object> response = followController.isMutual(principal, "otheruser");

        assertEquals("success", response.get("status"));
        assertEquals(true, response.get("mutual"));
    }

    @Test
    void getSuggestions_Success() {
        mockPrincipal();
        when(followService.getSuggestions(username)).thenReturn(Collections.emptyList());

        Map<String, Object> response = followController.getSuggestions(principal);

        assertEquals("success", response.get("status"));
    }
}

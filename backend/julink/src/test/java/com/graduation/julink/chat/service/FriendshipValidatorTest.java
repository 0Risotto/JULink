package com.graduation.julink.chat.service;

import com.graduation.julink.follow.FollowRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FriendshipValidatorTest {

    @Mock
    private FollowRepository followRepository;

    @InjectMocks
    private FriendshipValidator friendshipValidator;

    @Test
    void areFriends_ReturnsTrue() {
        when(followRepository.isMutual("user1", "user2")).thenReturn(true);
        assertTrue(friendshipValidator.areFriends("user1", "user2"));
    }

    @Test
    void areFriends_ReturnsFalse() {
        when(followRepository.isMutual("user1", "user2")).thenReturn(false);
        assertFalse(friendshipValidator.areFriends("user1", "user2"));
    }

    @Test
    void assertFriends_Success() {
        when(followRepository.isMutual("user1", "user2")).thenReturn(true);
        assertDoesNotThrow(() -> friendshipValidator.assertFriends("user1", "user2"));
    }

    @Test
    void assertFriends_ThrowsException() {
        when(followRepository.isMutual("user1", "user2")).thenReturn(false);
        SecurityException exception = assertThrows(SecurityException.class, 
                () -> friendshipValidator.assertFriends("user1", "user2"));
        assertEquals("Users 'user1' and 'user2' must be mutual follows to interact in chat.", exception.getMessage());
    }
}

package com.graduation.julink.profile;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.auth.ThemePreference;
import com.graduation.julink.block.BlockService;
import com.graduation.julink.common.media.MediaUploadService;
import com.graduation.julink.post.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    @Mock
    private AuthRepository authRepository;

    @Mock
    private ProfileMapper profileMapper;

    @Mock
    private MediaUploadService mediaUploadService;

    @Mock
    private BlockService blockService;

    @Mock
    private PostRepository postRepository;

    @InjectMocks
    private ProfileServiceImplementation profileService;

    private User user;
    private String email = "test@ju.edu.jo";

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail(email);
        user.setUsername("testuser");
        user.setFirstName("Test");
        user.setLastName("User");
    }

    @Test
    void getProfileByEmail_Success() {
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(postRepository.countByOwner_Id(user.getId())).thenReturn(3L);
        ProfileDTOs.UserProfile profile = new ProfileDTOs.UserProfile("testuser", "Test", "User", "KASIT", null, null, null, java.util.Collections.emptyList(), java.util.Collections.emptyList(), 3);
        when(profileMapper.toDTO(user, 3L)).thenReturn(profile);

        ProfileDTOs.UserProfile result = profileService.getProfileByEmail(email);

        assertNotNull(result);
        assertEquals("testuser", result.username());
        assertEquals(3, result.postsNumber());
        verify(postRepository).countByOwner_Id(user.getId());
    }

    @Test
    void getProfileByEmail_UserNotFound() {
        when(authRepository.findByEmail(email)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, 
                () -> profileService.getProfileByEmail(email));
        assertEquals("User not found for the provided token", exception.getMessage());
    }

    @Test
    void getProfileByUsername_Success() {
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(authRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(postRepository.countByOwner_Id(user.getId())).thenReturn(5L);
        ProfileDTOs.UserProfile profile = new ProfileDTOs.UserProfile("testuser", "Test", "User", "KASIT", null, null, null, java.util.Collections.emptyList(), java.util.Collections.emptyList(), 5);
        when(profileMapper.toDTO(user, 5L)).thenReturn(profile);

        ProfileDTOs.UserProfile result = profileService.getProfileByUsername(email, "testuser");

        assertNotNull(result);
        assertEquals("testuser", result.username());
        assertEquals(5, result.postsNumber());
        verify(blockService).assertNotBlocked(user.getId(), user.getId());
        verify(postRepository).countByOwner_Id(user.getId());
    }

    @Test
    void updateProfile_Success() {
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
        ProfileDTOs.UpdateProfile req = new ProfileDTOs.UpdateProfile("bio", "pfp", "banner", ThemePreference.DARK);
        when(postRepository.countByOwner_Id(user.getId())).thenReturn(2L);
        ProfileDTOs.UserProfile profile = new ProfileDTOs.UserProfile("testuser", "Test", "User", "KASIT", "bio", "pfp", "banner", java.util.Collections.emptyList(), java.util.Collections.emptyList(), 2);
        when(profileMapper.toDTO(user, 2L)).thenReturn(profile);

        ProfileDTOs.UserProfile result = profileService.updateProfile(email, req);

        assertNotNull(result);
        assertEquals(2, result.postsNumber());
        assertEquals("bio", user.getBio());
        assertEquals(ThemePreference.DARK, user.getThemePreference());
        verify(authRepository, times(1)).save(user);
        verify(postRepository).countByOwner_Id(user.getId());
    }

    @Test
    void getOwnUsername_Success() {
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));

        String result = profileService.getOwnUsername(email);

        assertEquals("testuser", result);
    }

    @Test
    void completeOnboarding_Success() {
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
        ProfileDTOs.OnboardingRequest req = new ProfileDTOs.OnboardingRequest("bio", "pfp", "banner", ThemePreference.LIGHT);

        profileService.completeOnboarding(email, req);

        assertEquals("bio", user.getBio());
        assertEquals("pfp", user.getProfilePictureUrl());
        assertEquals(ThemePreference.LIGHT, user.getThemePreference());
        assertFalse(user.isFirstLogin());
        verify(authRepository, times(1)).save(user);
    }
}

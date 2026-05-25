package com.graduation.julink.profile;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.common.media.MediaUploadService;
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

    @InjectMocks
    private ProfileServiceImplementation profileService;

    private User user;
    private String email = "test@ju.edu.jo";

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail(email);
        user.setUsername("testuser");
        user.setFirstName("Test");
        user.setLastName("User");
    }

    @Test
    void getProfileByEmail_Success() {
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
        ProfileDTOs.UserProfile profile = new ProfileDTOs.UserProfile("testuser", "Test", "User", "KASIT", null, null, null, java.util.Collections.emptyList(), java.util.Collections.emptyList(), 0);
        when(profileMapper.toDTO(user)).thenReturn(profile);

        ProfileDTOs.UserProfile result = profileService.getProfileByEmail(email);

        assertNotNull(result);
        assertEquals("testuser", result.username());
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
        when(authRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        ProfileDTOs.UserProfile profile = new ProfileDTOs.UserProfile("testuser", "Test", "User", "KASIT", null, null, null, java.util.Collections.emptyList(), java.util.Collections.emptyList(), 0);
        when(profileMapper.toDTO(user)).thenReturn(profile);

        ProfileDTOs.UserProfile result = profileService.getProfileByUsername("testuser");

        assertNotNull(result);
        assertEquals("testuser", result.username());
    }

    @Test
    void updateProfile_Success() {
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
        ProfileDTOs.UpdateProfile req = new ProfileDTOs.UpdateProfile("bio", "pfp", "banner");
        ProfileDTOs.UserProfile profile = new ProfileDTOs.UserProfile("testuser", "Test", "User", "KASIT", "bio", "pfp", "banner", java.util.Collections.emptyList(), java.util.Collections.emptyList(), 0);
        when(profileMapper.toDTO(user)).thenReturn(profile);

        ProfileDTOs.UserProfile result = profileService.updateProfile(email, req);

        assertNotNull(result);
        assertEquals("bio", user.getBio());
        verify(authRepository, times(1)).save(user);
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
        ProfileDTOs.OnboardingRequest req = new ProfileDTOs.OnboardingRequest("bio", "pfp", "banner");

        profileService.completeOnboarding(email, req);

        assertEquals("bio", user.getBio());
        assertEquals("pfp", user.getProfilePictureUrl());
        assertFalse(user.isFirstLogin());
        verify(authRepository, times(1)).save(user);
    }
}

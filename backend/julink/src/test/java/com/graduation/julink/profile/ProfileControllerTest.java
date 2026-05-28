package com.graduation.julink.profile;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.security.Principal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileControllerTest {

    @Mock
    private ProfileService profileService;

    @Mock
    private Principal principal;

    @InjectMocks
    private ProfileController profileController;

    private String email = "test@ju.edu.jo";

    @BeforeEach
    void setUp() {
        lenient().when(principal.getName()).thenReturn(email);
    }

    @Test
    void getMyProfile_Success() {
        ProfileDTOs.UserProfile profile = new ProfileDTOs.UserProfile("user", "First", "Last", "KASIT", "bio", "pfp", "banner", java.util.Collections.emptyList(), java.util.Collections.emptyList(), 0);
        when(profileService.getProfileByEmail(email)).thenReturn(profile);

        Map<String, Object> response = profileController.getMyProfile(principal);

        assertEquals("success", response.get("status"));
        assertEquals(profile, response.get("user"));
    }

    @Test
    void getMyUsername_Success() {
        when(profileService.getOwnUsername(email)).thenReturn("user");

        Map<String, Object> response = profileController.getMyUsername(principal);

        assertEquals("Success", response.get("Status"));
        assertEquals("user", response.get("username"));
    }

    @Test
    void getUserProfile_Success() {
        ProfileDTOs.UserProfile profile = new ProfileDTOs.UserProfile("user", "First", "Last", "KASIT", "bio", "pfp", "banner", java.util.Collections.emptyList(), java.util.Collections.emptyList(), 0);
        when(profileService.getProfileByUsername(email, "user")).thenReturn(profile);

        Map<String, Object> response = profileController.getUserProfile(principal, "USER "); // tests formatting too

        assertEquals("success", response.get("status"));
        assertEquals(profile, response.get("user"));
    }

    @Test
    void updateMyProfile_Success() {
        ProfileDTOs.UpdateProfile req = new ProfileDTOs.UpdateProfile("bio", "pfp", "banner");
        ProfileDTOs.UserProfile profile = new ProfileDTOs.UserProfile("user", "First", "Last", "KASIT", "bio", "pfp", "banner", java.util.Collections.emptyList(), java.util.Collections.emptyList(), 0);
        when(profileService.updateProfile(email, req)).thenReturn(profile);

        Map<String, Object> response = profileController.updateMyProfile(principal, req);

        assertEquals("success", response.get("status"));
        assertEquals(profile, response.get("user"));
    }

    @Test
    void completeOnboarding_Success() {
        ProfileDTOs.OnboardingRequest req = new ProfileDTOs.OnboardingRequest("bio", "pfp", "banner");
        doNothing().when(profileService).completeOnboarding(email, req);

        Map<String, Object> response = profileController.completeOnboarding(principal, req);

        assertEquals("success", response.get("status"));
        assertEquals("Onboarding completed", response.get("message"));
    }

    @Test
    void healthCheck_Success() {
        Map<String, String> response = profileController.healthCheck();

        assertEquals("ok", response.get("status"));
        assertEquals("Profile Controller is running", response.get("service"));
    }
}

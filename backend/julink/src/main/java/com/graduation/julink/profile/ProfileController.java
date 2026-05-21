package com.graduation.julink.profile;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/profile")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping("/me")
    public Map<String, Object> getMyProfile(Principal principal) {
        try {
            String email = principal.getName();

            ProfileDTOs.UserProfile profile = profileService.getProfileByEmail(email);

            return Map.of("status", "success", "user", profile);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping("/ownusername")
    public Map<String,Object>getMyUsername(Principal principal){
        try {
            String email = principal.getName();
            String username = profileService.getOwnUsername(email);
            return Map.of("Status","Success","username",username);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping("/{username}")
    public Map<String, Object> getUserProfile(@PathVariable String username) {
        try {
            String formattedUsername = username.toLowerCase().trim();

            ProfileDTOs.UserProfile profile = profileService.getProfileByUsername(formattedUsername);

            return Map.of("status", "success", "user", profile);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @PatchMapping("/me")
    public Map<String, Object> updateMyProfile(Principal principal, @RequestBody ProfileDTOs.UpdateProfile dto) {
        try {
            String email = principal.getName();
            ProfileDTOs.UserProfile updatedProfile = profileService.updateProfile(email, dto);
            return Map.of("status", "success", "user", updatedProfile);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @PutMapping("/setup")
    public Map<String, Object> completeOnboarding(Principal principal, @RequestBody ProfileDTOs.OnboardingRequest dto) {
        try {
            String email = principal.getName();
            profileService.completeOnboarding(email, dto);
            return Map.of("status", "success", "message", "Onboarding completed");
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        return Map.of(
                "status", "ok",
                "service", "Profile Controller is running"
        );
    }
}
package com.example.JuLink.features.profile;

import com.example.JuLink.features.profile.dto.UpdateProfileDTO;
import com.example.JuLink.features.profile.dto.UserProfileDTO;
import com.example.JuLink.features.profile.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/users")
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public Map<String, Object> getMyProfile(Principal principal) {
        try {
            String email = principal.getName();

            UserProfileDTO profile = userProfileService.getProfileByEmail(email);

            return Map.of("status", "success", "user", profile);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping("/{username}")
    public Map<String, Object> getUserProfile(@PathVariable String username) {
        try {
            String formattedUsername = username.toLowerCase().trim();

            UserProfileDTO profile = userProfileService.getProfileByUsername(formattedUsername);

            return Map.of("status", "success", "user", profile);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }
    @PatchMapping("/me")
    public Map<String, Object> updateMyProfile(Principal principal, @RequestBody UpdateProfileDTO dto) {
        try {
            String email = principal.getName();
            UserProfileDTO updatedProfile = userProfileService.updateProfile(email, dto);
            return Map.of("status", "success", "user", updatedProfile);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

}
package com.example.JuLink.features.profile.service;

import com.example.JuLink.features.profile.dto.UpdateProfileDTO;
import com.example.JuLink.features.profile.dto.UserProfileDTO;

public interface UserProfileService {
    UserProfileDTO getProfileByEmail(String email);
    UserProfileDTO getProfileByUsername(String username);
    UserProfileDTO updateProfile(String email, UpdateProfileDTO dto);
}

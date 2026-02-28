package com.example.JuLink.features.profile.service;

import com.example.JuLink.features.auth.entity.User;
import com.example.JuLink.features.auth.reposotiry.UserRepo;
import com.example.JuLink.features.profile.dto.UpdateProfileDTO;
import com.example.JuLink.features.profile.dto.UserProfileDTO;
import com.example.JuLink.features.profile  .mapper.UserProfileMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepo userRepo;
    private final UserProfileMapper userProfileMapper; // Injects the interface, not the impl!

    @Override
    public UserProfileDTO getProfileByEmail(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found for the provided token"));

        return userProfileMapper.toDTO(user);
    }

    @Override
    public UserProfileDTO getProfileByUsername(String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        return userProfileMapper.toDTO(user);
    }

    @Override
    public UserProfileDTO updateProfile(String email, UpdateProfileDTO dto) {

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.bio() != null) {
            user.setBio(dto.bio());
        }
        if (dto.profilePicture() != null) {
            user.setProfilePictureUrl(dto.profilePicture());
        }
        if (dto.bannerPhoto() != null) {
            user.setBannerPhotoUrl(dto.bannerPhoto());
        }
        userRepo.save(user);
        return userProfileMapper.toDTO(user);
    }
}
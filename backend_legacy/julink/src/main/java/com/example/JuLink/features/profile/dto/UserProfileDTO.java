package com.example.JuLink.features.profile.dto;

import java.util.List;

public record UserProfileDTO(
        String username,
        String firstName,
        String lastName,
        String college,
        String bio,
        String profilePicture,
        String bannerPhoto,
        List<FollowUserDTO> followings,
        List<FollowUserDTO> followers,
        int postsNumber
) {}
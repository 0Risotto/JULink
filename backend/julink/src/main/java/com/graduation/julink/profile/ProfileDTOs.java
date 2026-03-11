package com.graduation.julink.profile;

import java.util.List;

public class ProfileDTOs {
    private ProfileDTOs() {}

    public record FollowUserDTO(
            String username,
            String fullName,
            String pfp
    ) {}

    public record UpdateProfileDTO(
            String bio,
            String profilePicture,
            String bannerPhoto
    ) {}

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
}

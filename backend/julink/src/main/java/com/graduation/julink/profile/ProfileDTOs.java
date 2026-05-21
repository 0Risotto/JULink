package com.graduation.julink.profile;

import java.util.List;

public class ProfileDTOs {
    private ProfileDTOs() {}

    public record FollowUser(
            String username,
            String fullName,
            String pfp
    ) {}

    public record UpdateProfile(
            String bio,
            String profilePicture,
            String bannerPhoto
    ) {}

    public record UserProfile(
            String username,
            String firstName,
            String lastName,
            String college,
            String bio,
            String profilePicture,
            String bannerPhoto,
            List<FollowUser> followings,
            List<FollowUser> followers,
            int postsNumber
    ) {}

    public record OnboardingRequest(
            String bio,
            String profilePicture,
            String bannerPhoto
    ) {}
}

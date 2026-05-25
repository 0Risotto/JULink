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
            String bannerPhoto,
            byte[] profilePictureBytes,
            String profilePictureFilename,
            String profilePictureContentType,
            byte[] bannerPhotoBytes,
            String bannerPhotoFilename,
            String bannerPhotoContentType
    ) {
        public UpdateProfile(String bio, String profilePicture, String bannerPhoto) {
            this(bio, profilePicture, bannerPhoto, null, null, null, null, null, null);
        }
    }

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
            String bannerPhoto,
            byte[] profilePictureBytes,
            String profilePictureFilename,
            String profilePictureContentType,
            byte[] bannerPhotoBytes,
            String bannerPhotoFilename,
            String bannerPhotoContentType
    ) {
        public OnboardingRequest(String bio, String profilePicture, String bannerPhoto) {
            this(bio, profilePicture, bannerPhoto, null, null, null, null, null, null);
        }
    }
}

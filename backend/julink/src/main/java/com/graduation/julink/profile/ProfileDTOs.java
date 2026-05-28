package com.graduation.julink.profile;

import com.graduation.julink.auth.ThemePreference;

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
            ThemePreference themePreference,
            byte[] profilePictureBytes,
            String profilePictureFilename,
            String profilePictureContentType,
            byte[] bannerPhotoBytes,
            String bannerPhotoFilename,
            String bannerPhotoContentType
    ) {
        public UpdateProfile(String bio, String profilePicture, String bannerPhoto) {
            this(bio, profilePicture, bannerPhoto, null, null, null, null, null, null, null);
        }

        public UpdateProfile(String bio, String profilePicture, String bannerPhoto, ThemePreference themePreference) {
            this(bio, profilePicture, bannerPhoto, themePreference, null, null, null, null, null, null);
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
            ThemePreference themePreference,
            List<FollowUser> followings,
            List<FollowUser> followers,
            int postsNumber
    ) {
        public UserProfile(
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
        ) {
            this(username, firstName, lastName, college, bio, profilePicture, bannerPhoto,
                    ThemePreference.SYSTEM, followings, followers, postsNumber);
        }
    }

    public record OnboardingRequest(
            String bio,
            String profilePicture,
            String bannerPhoto,
            ThemePreference themePreference,
            byte[] profilePictureBytes,
            String profilePictureFilename,
            String profilePictureContentType,
            byte[] bannerPhotoBytes,
            String bannerPhotoFilename,
            String bannerPhotoContentType
    ) {
        public OnboardingRequest(String bio, String profilePicture, String bannerPhoto) {
            this(bio, profilePicture, bannerPhoto, null, null, null, null, null, null, null);
        }

        public OnboardingRequest(String bio, String profilePicture, String bannerPhoto, ThemePreference themePreference) {
            this(bio, profilePicture, bannerPhoto, themePreference, null, null, null, null, null, null);
        }
    }
}

package com.graduation.julink.profile;

import com.graduation.julink.auth.AuthEntities;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

public interface ProfileMapper {
    ProfileDTOs.UserProfile toDTO(AuthEntities.User user, long postsNumber);
}
@Component
class ProfileMapperImplementation implements ProfileMapper {

    @Override
    public ProfileDTOs.UserProfile toDTO(AuthEntities.User user, long postsNumber) {
        return new ProfileDTOs.UserProfile(
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getCollege() != null ? user.getCollege() : null,
                user.getBio(),
                user.getProfilePictureUrl(),
                user.getBannerPhotoUrl(),
                user.getThemePreference(),
                new ArrayList<>(),
                new ArrayList<>(),
                Math.toIntExact(postsNumber)
        );
    }
}

package com.graduation.julink.profile;

import com.graduation.julink.auth.AuthEntities;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

public interface ProfileMapper {
    ProfileDTOs.UserProfileDTO toDTO(AuthEntities.User user);
}
@Component
class ProfileMapperImplementation implements ProfileMapper {

    @Override
    public ProfileDTOs.UserProfileDTO toDTO(AuthEntities.User user) {
        return new ProfileDTOs.UserProfileDTO(
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getCollege() != null ? user.getCollege() : null,
                user.getBio(),
                user.getProfilePictureUrl(),
                user.getBannerPhotoUrl(),
                new ArrayList<>(),
                new ArrayList<>(),
                0
        );
    }
}
package com.graduation.julink.profile;

import com.graduation.julink.auth.AuthEntities;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

public interface ProfileMapper {
    ProfileDTOs.UserProfile toDTO(AuthEntities.User user);
}
@Component
class ProfileMapperImplementation implements ProfileMapper {

    @Override
    public ProfileDTOs.UserProfile toDTO(AuthEntities.User user) {
        return new ProfileDTOs.UserProfile(
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
package com.example.JuLink.features.profile.mapper;

import com.example.JuLink.features.auth.entity.User;
import com.example.JuLink.features.profile.dto.UserProfileDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Component
public class UserProfileMapperImpl implements UserProfileMapper {

    @Override
    public UserProfileDTO toDTO(User user) {
        return new UserProfileDTO(
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
package com.example.JuLink.features.profile.mapper;


import com.example.JuLink.features.auth.entity.User;
import com.example.JuLink.features.profile.dto.UserProfileDTO;

public interface UserProfileMapper {
    UserProfileDTO toDTO(User user);
}
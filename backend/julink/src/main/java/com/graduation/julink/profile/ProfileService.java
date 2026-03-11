package com.graduation.julink.profile;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

public interface ProfileService {
    ProfileDTOs.UserProfileDTO getProfileByEmail(String email);
    ProfileDTOs.UserProfileDTO getProfileByUsername(String username);
    ProfileDTOs.UserProfileDTO updateProfile(String email, ProfileDTOs.UpdateProfileDTO dto);
    String getOwnUsername(String email);
}

@Service
@RequiredArgsConstructor
class ProfileServiceImplementation implements ProfileService {

    private final AuthRepository authRepository;
    private final ProfileMapper ProfileMapper;

    @Override
    public ProfileDTOs.UserProfileDTO getProfileByEmail(String email) {
        AuthEntities.User user = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found for the provided token"));

        return ProfileMapper.toDTO(user);
    }

    @Override
    public ProfileDTOs.UserProfileDTO getProfileByUsername(String username) {
        AuthEntities.User user = authRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        return ProfileMapper.toDTO(user);
    }

    @Override
    public ProfileDTOs.UserProfileDTO updateProfile(String email, ProfileDTOs.UpdateProfileDTO dto) {

        AuthEntities.User user = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.bio() != null) {
            user.setBio(dto.bio());
        }
        if (dto.profilePicture() != null) {
            user.setProfilePictureUrl(dto.profilePicture());
        }
        if (dto.bannerPhoto() != null) {
            user.setBannerPhotoUrl(dto.bannerPhoto());
        }
        authRepository.save(user);
        return ProfileMapper.toDTO(user);
    }

    @Override
    public String getOwnUsername(String email) {
        return authRepository.findByEmail(email)
                .map(AuthEntities.User::getUsername)
                .orElse(null);
    }
}
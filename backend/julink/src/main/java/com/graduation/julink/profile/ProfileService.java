package com.graduation.julink.profile;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.common.media.MediaUploadService;
import com.graduation.julink.common.media.MediaUploadService.ImageVariant;
import com.graduation.julink.common.media.MediaUploadService.MediaUploadRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;

public interface ProfileService {
    ProfileDTOs.UserProfile getProfileByEmail(String email);
    ProfileDTOs.UserProfile getProfileByUsername(String username);
    ProfileDTOs.UserProfile updateProfile(String email, ProfileDTOs.UpdateProfile dto);
    String getOwnUsername(String email);
    void completeOnboarding(String email, ProfileDTOs.OnboardingRequest dto);
}

@Service
@RequiredArgsConstructor
class ProfileServiceImplementation implements ProfileService {

    private final AuthRepository authRepository;
    private final ProfileMapper ProfileMapper;
    private final MediaUploadService mediaUploadService;

    @Override
    public ProfileDTOs.UserProfile getProfileByEmail(String email) {
        AuthEntities.User user = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found for the provided token"));

        return ProfileMapper.toDTO(user);
    }

    @Override
    public ProfileDTOs.UserProfile getProfileByUsername(String username) {
        AuthEntities.User user = authRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        return ProfileMapper.toDTO(user);
    }

    @Override
    public ProfileDTOs.UserProfile updateProfile(String email, ProfileDTOs.UpdateProfile dto) {

        AuthEntities.User user = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (dto.bio() != null) {
            user.setBio(dto.bio());
        }
        if (dto.profilePicture() != null) {
            user.setProfilePictureUrl(dto.profilePicture());
        } else if (dto.profilePictureBytes() != null && dto.profilePictureBytes().length > 0) {
            user.setProfilePictureUrl(uploadImage(
                    dto.profilePictureBytes(),
                    dto.profilePictureFilename(),
                    dto.profilePictureContentType(),
                    ImageVariant.PROFILE
            ));
        }
        if (dto.bannerPhoto() != null) {
            user.setBannerPhotoUrl(dto.bannerPhoto());
        } else if (dto.bannerPhotoBytes() != null && dto.bannerPhotoBytes().length > 0) {
            user.setBannerPhotoUrl(uploadImage(
                    dto.bannerPhotoBytes(),
                    dto.bannerPhotoFilename(),
                    dto.bannerPhotoContentType(),
                    ImageVariant.BANNER
            ));
        }
        if (dto.themePreference() != null) {
            user.setThemePreference(dto.themePreference());
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

    @Override
    @Transactional
    public void completeOnboarding(String email, ProfileDTOs.OnboardingRequest dto) {
        AuthEntities.User user = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setBio(dto.bio());
        user.setProfilePictureUrl(resolveProfilePicture(dto));
        user.setBannerPhotoUrl(resolveBannerPhoto(dto));
        if (dto.themePreference() != null) {
            user.setThemePreference(dto.themePreference());
        }
        user.setFirstLogin(false); // The important flip!

        authRepository.save(user);
    }

    private String resolveProfilePicture(ProfileDTOs.OnboardingRequest dto) {
        if (dto.profilePicture() != null && !dto.profilePicture().isBlank()) {
            return dto.profilePicture();
        }
        if (dto.profilePictureBytes() == null || dto.profilePictureBytes().length == 0) {
            return dto.profilePicture();
        }
        return uploadImage(
                dto.profilePictureBytes(),
                dto.profilePictureFilename(),
                dto.profilePictureContentType(),
                ImageVariant.PROFILE
        );
    }

    private String resolveBannerPhoto(ProfileDTOs.OnboardingRequest dto) {
        if (dto.bannerPhoto() != null && !dto.bannerPhoto().isBlank()) {
            return dto.bannerPhoto();
        }
        if (dto.bannerPhotoBytes() == null || dto.bannerPhotoBytes().length == 0) {
            return dto.bannerPhoto();
        }
        return uploadImage(
                dto.bannerPhotoBytes(),
                dto.bannerPhotoFilename(),
                dto.bannerPhotoContentType(),
                ImageVariant.BANNER
        );
    }

    private String uploadImage(byte[] bytes, String filename, String contentType, ImageVariant variant) {
        try {
            return mediaUploadService.upload(new MediaUploadRequest(
                    bytes,
                    filename,
                    contentType,
                    variant
            )).url();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Profile image upload was interrupted", e);
        } catch (IOException e) {
            throw new RuntimeException("Profile image upload failed", e);
        }
    }
}

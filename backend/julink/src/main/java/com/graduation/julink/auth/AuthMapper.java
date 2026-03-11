package com.graduation.julink.auth;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

public interface AuthMapper {
    AuthEntities.User toEntity(AuthDTOs.CreateUserRequestDTO createUserRequestDTO);
    AuthEntities.OTP toOTP(AuthDTOs.OTPDTO otpDTO);
}

@Component
class AuthMapperImplementation implements AuthMapper {

    private final BCryptPasswordEncoder passwordEncoder;

    public AuthMapperImplementation(BCryptPasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public AuthEntities.User toEntity(AuthDTOs.CreateUserRequestDTO dto) {

        AuthEntities.User user = new AuthEntities.User();

        user.setUsername(dto.username().toLowerCase());
        user.setEmail(dto.email().toLowerCase());
        user.setFirstName(dto.firstName());
        user.setLastName(dto.lastName());
        user.setCollege(dto.college().toString());
        user.setPasswordHash(passwordEncoder.encode(dto.password()));

        return user;
    }

    @Override
    public AuthEntities.OTP toOTP(AuthDTOs.OTPDTO dto){
        AuthEntities.OTP otp = new AuthEntities.OTP();
        otp.setOtp(dto.otp());
        otp.setEmail(dto.email());
        return otp;
    }
}
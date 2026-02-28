package com.example.JuLink.features.auth.mapper;

import com.example.JuLink.features.auth.dto.CreateUserRequestDTO;
import com.example.JuLink.features.auth.dto.OTPDTO;
import com.example.JuLink.features.auth.entity.OTP;
import com.example.JuLink.features.auth.entity.User;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class UserMapperImpl implements UserMapper {

    private final BCryptPasswordEncoder passwordEncoder;

    public UserMapperImpl(BCryptPasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public User toEntity(CreateUserRequestDTO dto) {

        User user = new User();

        user.setUsername(dto.username().toLowerCase());
        user.setEmail(dto.email().toLowerCase());
        user.setFirstName(dto.firstName());
        user.setLastName(dto.lastName());
        user.setCollege(dto.college().toString());
        user.setPasswordHash(passwordEncoder.encode(dto.password()));

        return user;
    }
    @Override
    public OTP toOTP(OTPDTO dto){
        OTP otp = new OTP();
        otp.setOtp(dto.otp());
        otp.setEmail(dto.email());
        return otp;
    }

}

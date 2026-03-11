package com.example.JuLink.features.auth.mapper;

import com.example.JuLink.features.auth.dto.CreateUserRequestDTO;
import com.example.JuLink.features.auth.dto.OTPDTO;
import com.example.JuLink.features.auth.entity.OTP;
import com.example.JuLink.features.auth.entity.User;

public interface UserMapper {
    User toEntity(CreateUserRequestDTO createUserRequestDTO);
    OTP toOTP(OTPDTO otpDTO);
}

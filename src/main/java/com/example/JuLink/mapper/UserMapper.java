package com.example.JuLink.mapper;

import com.example.JuLink.dto.CreateUserRequestDTO;
import com.example.JuLink.dto.OTPDTO;
import com.example.JuLink.entity.OTP;
import com.example.JuLink.entity.User;

public interface UserMapper {
    User toEntity(CreateUserRequestDTO createUserRequestDTO);
    OTP toOTP(OTPDTO otpDTO);
}

package com.example.Julink.mapper;

import com.example.Julink.dto.CreateUserRequestDTO;
import com.example.Julink.dto.OTPDTO;
import com.example.Julink.entity.OTP;
import com.example.Julink.entity.User;

public interface UserMapper {
    User toEntity(CreateUserRequestDTO createUserRequestDTO);
    OTP toOTP(OTPDTO otpDTO);
}

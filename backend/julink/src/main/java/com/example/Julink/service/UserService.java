package com.example.Julink.service;

import com.example.Julink.dto.CreateUserRequestDTO;
import com.example.Julink.dto.LoginUserDTO;

import java.time.LocalDateTime;


public interface UserService {
    void createUser(CreateUserRequestDTO createUserRequestDTO);
    void sendOTP(String email);
    void verifyOTP(String otp, String email);
    void loginUser(LoginUserDTO loginUserDTO);
}

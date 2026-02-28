package com.example.JuLink.features.auth.service;

import com.example.JuLink.features.auth.dto.CreateUserRequestDTO;
import com.example.JuLink.features.auth.dto.LoginUserDTO;
import org.springframework.security.core.Authentication;


public interface UserService {
    void createUser(CreateUserRequestDTO createUserRequestDTO);
    void sendOTP(String email);
    void verifyOTP(String otp, String email);
    Authentication loginUser(LoginUserDTO loginUserDTO);
}

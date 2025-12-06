package com.example.JuLink.service;

import com.example.JuLink.dto.CreateUserRequestDTO;
import com.example.JuLink.dto.LoginUserDTO;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;


public interface UserService {
    void createUser(CreateUserRequestDTO createUserRequestDTO);
    void sendOTP(String email);
    void verifyOTP(String otp, String email);
    Authentication loginUser(LoginUserDTO loginUserDTO);
}

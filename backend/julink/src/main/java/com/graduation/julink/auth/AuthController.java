package com.graduation.julink.auth;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.common.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @PostMapping("/register")
    public Map<String, Object> register(@RequestBody AuthDTOs.CreateUserRequestDTO createUserRequestDTO) {
        try {
            authService.createUser(createUserRequestDTO);
            return Map.of(
                    "status", "success",
                    "message", "User registered successfully"
            );
        } catch (IllegalArgumentException e) {
            return Map.of(
                    "status", "error",
                    "message", e.getMessage()
            );
        } catch (Exception e) {
            return Map.of(
                    "status", "error",
                    "message", "Registration failed: " + e.getMessage()
            );
        }
    }

    @PostMapping("/send-otp")
    public Map<String, Object> sendOTP(@RequestBody AuthDTOs.SendOTPDTO sendOTPDTO) {
        try {
            authService.sendOTP(sendOTPDTO.email());
            System.out.println("Send OTP controller reached for email: " + sendOTPDTO.email());
            return Map.of(
                    "status", "success",
                    "message", "OTP sent successfully"
            );
        } catch (Exception e) {
            return Map.of(
                    "status", "error",
                    "message", "Failed to send OTP: " + e.getMessage()
            );
        }
    }

    @PostMapping("/verify-otp")
    public Map<String, Object> verifyOTP(@RequestBody AuthDTOs.OTPDTO otpDTO) {
        try {
            authService.verifyOTP(otpDTO.otp(), otpDTO.email());
            return Map.of(
                    "status", "success",
                    "message", "OTP verified successfully"
            );
        } catch (RuntimeException e) {
            return Map.of(
                    "status", "error",
                    "message", e.getMessage()
            );
        } catch (Exception e) {
            return Map.of(
                    "status", "error",
                    "message", "OTP verification failed: " + e.getMessage()
            );
        }
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody AuthDTOs.LoginUserDTO loginUserDTO) {
        try {

            var authentication = authService.loginUser(loginUserDTO);

            if (authentication == null) {
                return Map.of(
                        "status", "error",
                        "message", "Authentication failed"
                );
            }
            String email = authentication.getName();
            AuthEntities.User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String token = tokenService.generateToken(authentication);

            return Map.of(
                    "status", "success",
                    "token", token,
                    "isFirstLogin", user.isFirstLogin(),
                    "message", "Login successful"
            );

        } catch (RuntimeException e) {
            return Map.of(
                    "status", "error",
                    "message", "Login failed : incorrect email or password."
            );
        } catch (Exception e) {
            return Map.of(
                    "status", "error",
                    "message", "Login failed: " + e.getMessage()
            );
        }
    }

    @GetMapping("/health")
    public Map<String, String> healthCheck() {
        return Map.of(
                "status", "ok",
                "service", "Auth Controller is running"
        );
    }
}
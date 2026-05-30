package com.graduation.julink.auth;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.common.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
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
                    "themePreference", user.getThemePreference(),
                    "message", "Login successful"
            );

        } catch (RuntimeException e) {
            if ("Please verify your email before logging in".equals(e.getMessage())) {
                return Map.of(
                        "status", "error",
                        "message", e.getMessage()
                );
            }
            return Map.of(
                    "status", "error",
                    "message", "Login failed : incorrect email, username, or password."
            );
        } catch (Exception e) {
            return Map.of(
                    "status", "error",
                    "message", "Login failed: " + e.getMessage()
            );
        }
    }

    @DeleteMapping("/kill")
    public ResponseEntity<Map<String, String>> kill(Principal principal) {
        authService.kill(principal);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Account deleted successfully"
        ));
    }

    @PostMapping("/delete/send-otp")
    public Map<String, Object> sendDeleteOTP(Principal principal) {
        try {
            authService.sendDeleteOTP(principal);
            return Map.of(
                    "status", "success",
                    "message", "Delete account OTP sent successfully"
            );
        } catch (Exception e) {
            return Map.of(
                    "status", "error",
                    "message", "Failed to send delete account OTP: " + e.getMessage()
            );
        }
    }

    @DeleteMapping("/delete/verify")
    public ResponseEntity<Map<String, String>> killWithOTP(
            Principal principal,
            @RequestBody AuthDTOs.DeleteAccountOTPDTO dto
    ) {
        authService.killWithOTP(principal, dto);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Account deleted successfully"
        ));
    }

    @PostMapping("/password/change")
    public Map<String, Object> changePassword(
            Principal principal,
            @RequestBody AuthDTOs.ChangePasswordDTO dto
    ) {
        try {
            authService.changePassword(principal, dto);
            return Map.of(
                    "status", "success",
                    "message", "Password changed successfully"
            );
        } catch (Exception e) {
            return Map.of(
                    "status", "error",
                    "message", e.getMessage()
            );
        }
    }

    @PostMapping("/password/forgot/send-otp")
    public Map<String, Object> sendForgotPasswordOTP(@RequestBody AuthDTOs.ForgotPasswordOTPDTO dto) {
        try {
            authService.sendForgotPasswordOTP(dto);
            return Map.of(
                    "status", "success",
                    "message", "Password reset OTP sent successfully"
            );
        } catch (Exception e) {
            return Map.of(
                    "status", "error",
                    "message", e.getMessage()
            );
        }
    }

    @PostMapping("/password/forgot/reset")
    public Map<String, Object> resetPasswordWithOTP(@RequestBody AuthDTOs.ResetPasswordDTO dto) {
        try {
            authService.resetPasswordWithOTP(dto);
            return Map.of(
                    "status", "success",
                    "message", "Password reset successfully"
            );
        } catch (Exception e) {
            return Map.of(
                    "status", "error",
                    "message", e.getMessage()
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

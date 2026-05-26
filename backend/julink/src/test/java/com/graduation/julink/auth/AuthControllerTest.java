package com.graduation.julink.auth;

import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.common.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private AuthService authService;

    @Mock
    private AuthRepository userRepository;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private TokenService tokenService;

    @Mock
    private Principal principal;

    @InjectMocks
    private AuthController authController;

    private AuthDTOs.CreateUserRequestDTO createUserRequestDTO;

    @BeforeEach
    void setUp() {
        createUserRequestDTO = new AuthDTOs.CreateUserRequestDTO(
                "testuser", "test@ju.edu.jo", "Test", "User", CollegeEnum.KING_ABDULLAH_II_IT, "Password123!"
        );
    }

    @Test
    void register_Success() {
        doNothing().when(authService).createUser(createUserRequestDTO);

        Map<String, Object> response = authController.register(createUserRequestDTO);

        assertEquals("success", response.get("status"));
        assertEquals("User registered successfully", response.get("message"));
        verify(authService, times(1)).createUser(createUserRequestDTO);
    }

    @Test
    void register_IllegalArgumentException() {
        doThrow(new IllegalArgumentException("Email must end with @ju.edu.jo"))
                .when(authService).createUser(createUserRequestDTO);

        Map<String, Object> response = authController.register(createUserRequestDTO);

        assertEquals("error", response.get("status"));
        assertEquals("Email must end with @ju.edu.jo", response.get("message"));
    }

    @Test
    void sendOTP_Success() {
        AuthDTOs.SendOTPDTO sendOTPDTO = new AuthDTOs.SendOTPDTO("test@ju.edu.jo");
        doNothing().when(authService).sendOTP(sendOTPDTO.email());

        Map<String, Object> response = authController.sendOTP(sendOTPDTO);

        assertEquals("success", response.get("status"));
        assertEquals("OTP sent successfully", response.get("message"));
    }

    @Test
    void verifyOTP_Success() {
        AuthDTOs.OTPDTO otpDTO = new AuthDTOs.OTPDTO("123456", "test@ju.edu.jo");
        doNothing().when(authService).verifyOTP(otpDTO.otp(), otpDTO.email());

        Map<String, Object> response = authController.verifyOTP(otpDTO);

        assertEquals("success", response.get("status"));
        assertEquals("OTP verified successfully", response.get("message"));
    }

    @Test
    void login_Success() {
        AuthDTOs.LoginUserDTO loginUserDTO = new AuthDTOs.LoginUserDTO("test@ju.edu.jo", "Password123!");
        Authentication authentication = new UsernamePasswordAuthenticationToken("test@ju.edu.jo", "Password123!");
        AuthEntities.User user = new AuthEntities.User();
        user.setEmail("test@ju.edu.jo");
        user.setFirstLogin(true);

        when(authService.loginUser(loginUserDTO)).thenReturn(authentication);
        when(userRepository.findByEmail("test@ju.edu.jo")).thenReturn(Optional.of(user));
        when(tokenService.generateToken(authentication)).thenReturn("mock-jwt-token");

        Map<String, Object> response = authController.login(loginUserDTO);

        assertEquals("success", response.get("status"));
        assertEquals("mock-jwt-token", response.get("token"));
        assertEquals(true, response.get("isFirstLogin"));
        assertEquals("Login successful", response.get("message"));
    }

    @Test
    void healthCheck_Success() {
        Map<String, String> response = authController.healthCheck();

        assertEquals("ok", response.get("status"));
        assertEquals("Auth Controller is running", response.get("service"));
    }

    @Test
    void kill_Success() {
        doNothing().when(authService).kill(principal);

        ResponseEntity<Map<String, String>> response = authController.kill(principal);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("success", response.getBody().get("status"));
        assertEquals("Account deleted successfully", response.getBody().get("message"));
        verify(authService, times(1)).kill(principal);
    }
}

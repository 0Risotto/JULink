package com.graduation.julink.auth;

import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.auth.Repository.OTPRepository;
import com.graduation.julink.block.BlockService;
import com.graduation.julink.follow.FollowRepository;
import jakarta.mail.internet.MimeMessage;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplementationTest {

    @Mock
    private FollowRepository followRepository;

    @Mock
    private BlockService blockService;

    @Mock
    private AuthRepository userRepository;

    @Mock
    private OTPRepository otpRepository;

    @Mock
    private AuthMapper authMapper;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query query;

    @Mock
    private Principal principal;

    @InjectMocks
    private AuthServiceImplementation authService;

    @Mock
    private MimeMessage mimeMessage;

    private AuthDTOs.CreateUserRequestDTO createUserRequestDTO;
    private AuthEntities.User user;
    private AuthEntities.OTP otpEntity;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "entityManager", entityManager);

        createUserRequestDTO = new AuthDTOs.CreateUserRequestDTO(
                "testuser", "test@ju.edu.jo", "Test", "User", CollegeEnum.KING_ABDULLAH_II_IT, "Password123!"
        );

        user = new AuthEntities.User();
        user.setId(101L);
        user.setUsername("testuser");
        user.setEmail("test@ju.edu.jo");
        user.setPasswordHash("encodedPassword");

        otpEntity = new AuthEntities.OTP();
        otpEntity.setEmail("test@ju.edu.jo");
        otpEntity.setOtp("123456");
        otpEntity.setExpiresAt(LocalDateTime.now().plusMinutes(3));
    }

    @Test
    void createUser_Success() {
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.existsByEmail("test@ju.edu.jo")).thenReturn(false);
        when(authMapper.toEntity(createUserRequestDTO)).thenReturn(user);

        authService.createUser(createUserRequestDTO);

        verify(userRepository).save(user);
        verify(followRepository).createUser("testuser");
    }

    @Test
    void createUser_InvalidEmailFormat() {
        AuthDTOs.CreateUserRequestDTO invalidEmailDTO = new AuthDTOs.CreateUserRequestDTO(
                "testuser", "test@gmail.com", "Test", "User", CollegeEnum.KING_ABDULLAH_II_IT, "Password123!"
        );

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.createUser(invalidEmailDTO));
        assertEquals("Email must end with @ju.edu.jo", exception.getMessage());
    }

    @Test
    void sendOTP_Success() {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(authMapper.toOTP(any())).thenReturn(new AuthEntities.OTP());
        when(otpRepository.existsByEmail("test@ju.edu.jo")).thenReturn(true);

        authService.sendOTP("test@ju.edu.jo");

        verify(otpRepository).deleteByEmailIgnoreCase("test@ju.edu.jo");
        verify(otpRepository).save(any(AuthEntities.OTP.class));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void verifyOTP_Success() {
        when(otpRepository.findByEmail("test@ju.edu.jo")).thenReturn(Optional.of(otpEntity));

        authService.verifyOTP("123456", "test@ju.edu.jo");

        verify(otpRepository).deleteByEmailIgnoreCase("test@ju.edu.jo");
    }

    @Test
    void verifyOTP_InvalidOTP() {
        when(otpRepository.findByEmail("test@ju.edu.jo")).thenReturn(Optional.of(otpEntity));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.verifyOTP("654321", "test@ju.edu.jo"));
        assertEquals("Invalid OTP code", exception.getMessage());
    }

    @Test
    void verifyOTP_ExpiredOTP() {
        otpEntity.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(otpRepository.findByEmail("test@ju.edu.jo")).thenReturn(Optional.of(otpEntity));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.verifyOTP("123456", "test@ju.edu.jo"));
        assertEquals("OTP has expired. Please request a new one.", exception.getMessage());
        verify(otpRepository).deleteByEmailIgnoreCase("test@ju.edu.jo");
    }

    @Test
    void loginUser_Success() {
        AuthDTOs.LoginUserDTO loginUserDTO = new AuthDTOs.LoginUserDTO("test@ju.edu.jo", "Password123!");
        when(userRepository.findByEmail("test@ju.edu.jo")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", "encodedPassword")).thenReturn(true);

        Authentication auth = authService.loginUser(loginUserDTO);

        assertNotNull(auth);
        assertEquals("test@ju.edu.jo", auth.getName());
    }

    @Test
    void loginUser_WithUsername_Success() {
        AuthDTOs.LoginUserDTO loginUserDTO = new AuthDTOs.LoginUserDTO("testuser", "Password123!");
        when(userRepository.findByEmail("testuser")).thenReturn(Optional.empty());
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password123!", "encodedPassword")).thenReturn(true);

        Authentication auth = authService.loginUser(loginUserDTO);

        assertNotNull(auth);
        assertEquals("test@ju.edu.jo", auth.getName());
    }

    @Test
    void loginUser_InvalidPassword() {
        AuthDTOs.LoginUserDTO loginUserDTO = new AuthDTOs.LoginUserDTO("test@ju.edu.jo", "WrongPassword!");
        when(userRepository.findByEmail("test@ju.edu.jo")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword!", "encodedPassword")).thenReturn(false);

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> authService.loginUser(loginUserDTO));
        assertEquals("Invalid password", exception.getMessage());
    }

    @Test
    void kill_Success() {
        when(principal.getName()).thenReturn("test@ju.edu.jo");
        when(userRepository.findByEmail("test@ju.edu.jo")).thenReturn(Optional.of(user));
        when(otpRepository.existsByEmail("test@ju.edu.jo")).thenReturn(true);
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter("userId", 101L)).thenReturn(query);
        when(query.executeUpdate()).thenReturn(1);

        authService.kill(principal);

        verify(entityManager, atLeastOnce()).createNativeQuery(anyString());
        verify(entityManager, times(2)).createNativeQuery(contains("post_favorites"));
        verify(otpRepository).deleteByEmailIgnoreCase("test@ju.edu.jo");
        verify(followRepository).deleteUser("testuser");
        verify(userRepository).delete(user);
    }
}

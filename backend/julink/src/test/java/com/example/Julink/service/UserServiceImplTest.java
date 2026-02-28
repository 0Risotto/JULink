package com.example.Julink.service;

import com.example.Julink.dto.CreateUserRequestDTO;
import com.example.Julink.dto.LoginUserDTO;
import com.example.Julink.entity.OTP;
import com.example.Julink.entity.User;
import com.example.Julink.enums.College;
import com.example.Julink.mapper.UserMapper;
import com.example.Julink.reposotiry.OTPRepo;
import com.example.Julink.reposotiry.UserRepo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {

    @Mock
    private UserRepo userRepo;

    @Mock
    private UserMapper userMapper;

    @Mock
    private JavaMailSender javaMailSender;

    @Mock
    private OTPRepo otpRepo;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    // ---------- helpers ----------

    private CreateUserRequestDTO validCreateUserDto(String username, String email) {
        return new CreateUserRequestDTO(
                username,
                email,
                "Ahmad",
                "Almanasrah",
                College.KING_ABDULLAH_II_IT,
                "password123"
        );
    }

    private User userWithEmailAndPassword(String email, String passwordHash) {
        User u = new User();
        u.setEmail(email);
        u.setUsername("user");
        u.setPasswordHash(passwordHash);
        return u;
    }

    // ---------- createUser tests ----------

    @Test
    void createUser_success_whenUsernameAndEmailNotTaken() {
        String username = "newuser";
        String email = "newuser@ju.edu.jo";
        CreateUserRequestDTO dto = validCreateUserDto(username, email);

        User mappedUser = new User();
        mappedUser.setUsername(username);
        mappedUser.setEmail(email);

        when(userRepo.existsByUsername(username)).thenReturn(false);
        when(userRepo.existsByEmail(email)).thenReturn(false);
        when(userMapper.toEntity(dto)).thenReturn(mappedUser);

        assertDoesNotThrow(() -> userService.createUser(dto));

        verify(userRepo).existsByUsername(username);
        verify(userRepo).existsByEmail(email);
        verify(userMapper).toEntity(dto);
        verify(userRepo).save(mappedUser);
    }

    @Test
    void createUser_throws_whenEmailNotJuDomain() {
        CreateUserRequestDTO dto = validCreateUserDto("newuser", "newuser@gmail.com");

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userService.createUser(dto)
        );
        assertEquals("Email must end with @ju.edu.jo", ex.getMessage());

        verifyNoInteractions(userMapper, userRepo, otpRepo, javaMailSender);
    }

    @Test
    void createUser_throws_whenUsernameAlreadyExists() {
        String username = "existinguser";
        String email = "existinguser@ju.edu.jo";
        CreateUserRequestDTO dto = validCreateUserDto(username, email);

        when(userRepo.existsByUsername(username)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userService.createUser(dto)
        );
        assertEquals("Username already exists", ex.getMessage());

        verify(userRepo).existsByUsername(username);
        verify(userRepo, never()).existsByEmail(anyString());
        verifyNoInteractions(userMapper);
    }

    @Test
    void createUser_throws_whenEmailAlreadyExists() {
        String username = "newuser";
        String email = "existing@ju.edu.jo";
        CreateUserRequestDTO dto = validCreateUserDto(username, email);

        when(userRepo.existsByUsername(username)).thenReturn(false);
        when(userRepo.existsByEmail(email)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> userService.createUser(dto)
        );
        assertEquals("Email already exists", ex.getMessage());

        verify(userRepo).existsByUsername(username);
        verify(userRepo).existsByEmail(email);
        verifyNoInteractions(userMapper);
    }

    // ---------- loginUser tests ----------

    @Test
    void loginUser_success_whenUserExistsAndPasswordMatches() {
        String email = "user@ju.edu.jo";
        String rawPassword = "secret123";
        String hashedPassword = "hashed";

        LoginUserDTO dto = new LoginUserDTO(email, rawPassword);
        User user = userWithEmailAndPassword(email, hashedPassword);

        when(userRepo.findByEmail(email.toLowerCase().trim()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches(rawPassword, hashedPassword)).thenReturn(true);

        assertDoesNotThrow(() -> userService.loginUser(dto));

        verify(userRepo).findByEmail(email.toLowerCase().trim());
        verify(passwordEncoder).matches(rawPassword, hashedPassword);
    }

    @Test
    void loginUser_throws_whenUserDoesNotExist() {
        String email = "missing@ju.edu.jo";
        LoginUserDTO dto = new LoginUserDTO(email, "any");

        when(userRepo.findByEmail(email.toLowerCase().trim())).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> userService.loginUser(dto));

        verify(userRepo).findByEmail(email.toLowerCase().trim());
        verifyNoInteractions(passwordEncoder);
    }

    @Test
    void loginUser_throws_whenPasswordDoesNotMatch() {
        String email = "user@ju.edu.jo";
        String rawPassword = "wrong";
        String hashedPassword = "hashed";

        LoginUserDTO dto = new LoginUserDTO(email, rawPassword);
        User user = userWithEmailAndPassword(email, hashedPassword);

        when(userRepo.findByEmail(email.toLowerCase().trim()))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches(rawPassword, hashedPassword)).thenReturn(false);

        assertThrows(RuntimeException.class, () -> userService.loginUser(dto));

        verify(userRepo).findByEmail(email.toLowerCase().trim());
        verify(passwordEncoder).matches(rawPassword, hashedPassword);
    }

    // ---------- sendOTP tests ----------

    @Test
    void sendOTP_savesNewOtpAndSendsEmail_whenNoExistingOtp() {
        String email = "user@ju.edu.jo";

        when(otpRepo.existsByEmail(email.toLowerCase().trim())).thenReturn(false);
        // IMPORTANT: mapper must return a non-null OTP instance
        when(userMapper.toOTP(any())).thenReturn(new OTP());

        assertDoesNotThrow(() -> userService.sendOTP(email));

        verify(otpRepo).existsByEmail(email.toLowerCase().trim());
        verify(otpRepo, never()).deleteByEmailIgnoreCase(anyString());

        ArgumentCaptor<OTP> otpCaptor = ArgumentCaptor.forClass(OTP.class);
        verify(otpRepo).save(otpCaptor.capture());
        OTP savedOtp = otpCaptor.getValue();
        assertEquals(email.toLowerCase().trim(), savedOtp.getEmail());
        assertNotNull(savedOtp.getOtp());
        assertNotNull(savedOtp.getExpiresAt());

        verify(javaMailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    void sendOTP_deletesExistingOtpBeforeSavingNewOne() {
        String email = "user@ju.edu.jo";

        when(otpRepo.existsByEmail(email.toLowerCase().trim())).thenReturn(true);
        // again, avoid null from mapper
        when(userMapper.toOTP(any())).thenReturn(new OTP());

        assertDoesNotThrow(() -> userService.sendOTP(email));

        verify(otpRepo).existsByEmail(email.toLowerCase().trim());
        verify(otpRepo).deleteByEmailIgnoreCase(email.toLowerCase().trim());
        verify(otpRepo).save(any(OTP.class));
        verify(javaMailSender).send(any(SimpleMailMessage.class));
    }

    // ---------- verifyOTP tests ----------

    @Test
    void verifyOTP_success_whenOtpMatchesAndNotExpired() {
        String email = "user@ju.edu.jo";
        String otpValue = "123456";

        User user = userWithEmailAndPassword(email, "hashed");
        OTP otp = new OTP();
        otp.setEmail(email);
        otp.setOtp(otpValue);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(otpRepo.findByEmail(email)).thenReturn(Optional.of(otp));

        assertDoesNotThrow(() -> userService.verifyOTP(otpValue, email));

        verify(userRepo).findByEmail(email);
        verify(otpRepo).findByEmail(email);
        verify(userRepo, never()).deleteByEmail(anyString());
    }

    @Test
    void verifyOTP_deletesUser_whenOtpExpired() {
        String email = "user@ju.edu.jo";
        String otpValue = "123456";

        User user = userWithEmailAndPassword(email, "hashed");
        OTP otp = new OTP();
        otp.setEmail(email);
        otp.setOtp(otpValue);
        otp.setExpiresAt(LocalDateTime.now().minusMinutes(1)); // expired

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(otpRepo.findByEmail(email)).thenReturn(Optional.of(otp));

        assertDoesNotThrow(() -> userService.verifyOTP(otpValue, email));

        verify(userRepo).findByEmail(email);
        verify(otpRepo).findByEmail(email);
        verify(userRepo).deleteByEmail(email);
    }

    @Test
    void verifyOTP_throws_whenOtpDoesNotMatch() {
        String email = "user@ju.edu.jo";

        User user = userWithEmailAndPassword(email, "hashed");
        OTP otp = new OTP();
        otp.setEmail(email);
        otp.setOtp("654321"); // wrong otp
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(5));

        when(userRepo.findByEmail(email)).thenReturn(Optional.of(user));
        when(otpRepo.findByEmail(email)).thenReturn(Optional.of(otp));

        assertThrows(RuntimeException.class,
                () -> userService.verifyOTP("123456", email));

        verify(userRepo).findByEmail(email);
        verify(otpRepo).findByEmail(email);
        verify(userRepo, never()).deleteByEmail(anyString());
    }

    @Test
    void verifyOTP_throws_whenNoUserOrOtpFound() {
        String email = "user@ju.edu.jo";
        String otpValue = "123456";

        when(userRepo.findByEmail(email)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class,
                () -> userService.verifyOTP(otpValue, email));

        verify(userRepo).findByEmail(email);
        verifyNoInteractions(otpRepo);
    }
}

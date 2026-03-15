package com.graduation.julink.auth;
import com.graduation.julink.auth.Repository.OTPRepository;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.follow.FollowRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

public interface AuthService {
    void createUser(AuthDTOs.CreateUserRequestDTO createUserRequestDTO);
    void sendOTP(String email);
    void verifyOTP(String otp, String email);
    Authentication loginUser(AuthDTOs.LoginUserDTO loginUserDTO);
}

@Service
@RequiredArgsConstructor
@Transactional
class AuthServiceImplementation implements AuthService {
    private final FollowRepository followRepository;
    private final AuthRepository userRepository;
    private final OTPRepository otpRepository;
    private final AuthMapper authMapper;
    private final JavaMailSender mailSender;
    private final BCryptPasswordEncoder passwordEncoder;

    private static final String JU_EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@ju\\.edu\\.jo$";
    private static final int OTP_EXPIRY_MINUTES = 3;
    private static final String FROM_EMAIL = "ahmadalmanasrah204@gmail.com";

    @Override
    public void createUser(AuthDTOs.CreateUserRequestDTO dto) {
        validateCreateUserRequest(dto);

        AuthEntities.User user = authMapper.toEntity(dto);
        userRepository.save(user);
        // user gets created here for neo4j
        followRepository.createUser(user.getUsername());
        System.out.println("User created successfully: " + user.getEmail());
    }

    @Override
    public void sendOTP(String email) {
        String cleanedEmail = cleanEmail(email);
        String otpCode = generateOTP();

        deleteExistingOTP(cleanedEmail);
        sendOtpEmail(cleanedEmail, otpCode);
        saveOTP(cleanedEmail, otpCode);

        System.out.println("OTP sent successfully to: " + cleanedEmail);
    }

    @Override
    public void verifyOTP(String otp, String email) {
        String cleanedEmail = cleanEmail(email);

        AuthEntities.OTP otpEntity = findValidOTP(cleanedEmail);
        validateOTP(otpEntity, otp);

        // Mark user as verified if needed
        // userRepository.verifyEmail(cleanedEmail);

        deleteVerifiedOTP(cleanedEmail);
        System.out.println("OTP verified successfully for: " + cleanedEmail);
    }

    @Override
    public Authentication loginUser(AuthDTOs.LoginUserDTO loginUserDTO) {
        String email = cleanEmail(loginUserDTO.email());

        AuthEntities.User user = findUserByEmail(email);
        validatePassword(loginUserDTO.password(), user.getPasswordHash());

        return createAuthenticationToken(user);
    }

    // Private helper methods
    private void validateCreateUserRequest(AuthDTOs.CreateUserRequestDTO dto) {
        String username = dto.username().toLowerCase();
        String email = dto.email().toLowerCase();

        if (!email.matches(JU_EMAIL_REGEX)) {
            throw new IllegalArgumentException("Email must end with @ju.edu.jo");
        }

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username '" + username + "' already exists");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email '" + email + "' already exists");
        }
    }

    private String cleanEmail(String email) {
        return email.toLowerCase().trim();
    }

    private String generateOTP() {
        return String.format("%06d", (int) (Math.random() * 1000000));
    }

    private void deleteExistingOTP(String email) {
        if (otpRepository.existsByEmail(email)) {
            otpRepository.deleteByEmailIgnoreCase(email);
        }
    }

    private void sendOtpEmail(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(FROM_EMAIL);
        message.setTo(email);
        message.setSubject("JUlink Account Verification OTP");
        message.setText(String.format(
                "Hello,\n\n" +
                        "Your OTP for JUlink account verification is: %s\n" +
                        "This code will expire in %d minutes.\n\n" +
                        "If you didn't request this, please ignore this email.\n\n" +
                        "Thank you!",
                otp, OTP_EXPIRY_MINUTES
        ));

        try {
            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }

    private void saveOTP(String email, String otpCode) {
        AuthEntities.OTP otpEntity = authMapper.toOTP(new AuthDTOs.OTPDTO(otpCode, email));
        otpEntity.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpRepository.save(otpEntity);
    }

    private AuthEntities.OTP findValidOTP(String email) {
        return otpRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No OTP found for email: " + email));
    }

    private void validateOTP(AuthEntities.OTP otpEntity, String providedOtp) {
        if (!otpEntity.getOtp().equals(providedOtp)) {
            throw new RuntimeException("Invalid OTP code");
        }

        if (LocalDateTime.now().isAfter(otpEntity.getExpiresAt())) {
            otpRepository.deleteByEmailIgnoreCase(otpEntity.getEmail());
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }
    }

    private void deleteVerifiedOTP(String email) {
        otpRepository.deleteByEmailIgnoreCase(email);
    }

    private AuthEntities.User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    private void validatePassword(String rawPassword, String encodedPassword) {
        if (!passwordEncoder.matches(rawPassword, encodedPassword)) {
            throw new RuntimeException("Invalid password");
        }
    }

    private Authentication createAuthenticationToken(AuthEntities.User user) {
        return new UsernamePasswordAuthenticationToken(
                user.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_USER"))
        );
    }
}
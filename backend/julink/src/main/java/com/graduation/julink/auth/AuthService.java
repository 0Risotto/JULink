package com.graduation.julink.auth;
import com.graduation.julink.auth.Repository.OTPRepository;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.follow.FollowRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.MimeMessageHelper;
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
    private static final String FROM_EMAIL = "julink2026@gmail.com";

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
       saveOTP(cleanedEmail, otpCode);
       sendOtpEmail(cleanedEmail, otpCode);

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
        String identifier = cleanLoginIdentifier(loginUserDTO.identifier());

        AuthEntities.User user = findUserForLogin(identifier);
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

    private String cleanLoginIdentifier(String identifier) {
        return identifier.toLowerCase().trim();
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
        try {
            MimeMessage message = mailSender.createMimeMessage();

            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(FROM_EMAIL);
            helper.setTo(email);
            helper.setSubject("JUlink Account Verification OTP");

            String htmlContent = String.format("""
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#f3f6fb; font-family:Arial, Helvetica, sans-serif;">

    <table width="100%%" cellpadding="0" cellspacing="0" style="background-color:#f3f6fb; padding:40px 0;">
        <tr>
            <td align="center">

                <table width="620" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 8px 28px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#004aad,#0077ff); padding:30px 36px; text-align:left;">
                            <div style="color:#ffffff; font-size:26px; font-weight:bold; letter-spacing:0.5px;">
                                JUlink
                            </div>
                            <div style="color:#dbeafe; font-size:14px; margin-top:6px;">
                                University account verification
                            </div>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding:42px 38px 34px; color:#1f2937;">
                            
                            <div style="font-size:24px; font-weight:bold; color:#111827; margin-bottom:14px;">
                                Verify your email address
                            </div>

                            <div style="font-size:16px; line-height:1.7; color:#4b5563; margin-bottom:26px;">
                                Hello,<br>
                                Use the verification code below to complete your JUlink account verification.
                            </div>

                            <!-- OTP Box -->
                            <table width="100%%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                                <tr>
                                    <td align="center" style="background-color:#f0f6ff; border:1px solid #bfdbfe; border-radius:14px; padding:28px;">
                                        <div style="font-size:13px; color:#2563eb; font-weight:bold; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:12px;">
                                            Your OTP Code
                                        </div>

                                        <div style="font-size:42px; font-weight:bold; color:#004aad; letter-spacing:10px;">
                                            %s
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <div style="font-size:15px; line-height:1.7; color:#4b5563;">
                                This code will expire in 
                                <strong style="color:#111827;">%d minutes</strong>.
                                <br>
                                If you did not request this code, you can safely ignore this email.
                            </div>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color:#f9fafb; padding:22px 36px; border-top:1px solid #e5e7eb; text-align:center;">
                            <div style="font-size:13px; color:#6b7280; line-height:1.6;">
                                This is an automated message from JUlink.<br>
                                Please do not reply to this email.
                            </div>
                        </td>
                    </tr>

                </table>

                <div style="font-size:12px; color:#9ca3af; margin-top:18px;">
                    © 2026 JUlink. All rights reserved.
                </div>

            </td>
        </tr>
    </table>

</body>
</html>
""", otp, OTP_EXPIRY_MINUTES);

            helper.setText(htmlContent, true);

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

    private AuthEntities.User findUserForLogin(String identifier) {
        return userRepository.findByEmail(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .orElseThrow(() -> new RuntimeException("User not found with email or username: " + identifier));
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

package com.graduation.julink.auth;

import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.auth.Repository.OTPRepository;
import com.graduation.julink.block.BlockService;
import com.graduation.julink.follow.FollowRepository;
import jakarta.mail.internet.MimeMessage;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

public interface AuthService {
    void createUser(AuthDTOs.CreateUserRequestDTO createUserRequestDTO);
    void sendOTP(String email);
    void verifyOTP(String otp, String email);
    Authentication loginUser(AuthDTOs.LoginUserDTO loginUserDTO);
    void kill(Principal principal);
    void sendDeleteOTP(Principal principal);
    void killWithOTP(Principal principal, AuthDTOs.DeleteAccountOTPDTO dto);
    void changePassword(Principal principal, AuthDTOs.ChangePasswordDTO dto);
    void sendForgotPasswordOTP(AuthDTOs.ForgotPasswordOTPDTO dto);
    void resetPasswordWithOTP(AuthDTOs.ResetPasswordDTO dto);
}

@Service
@RequiredArgsConstructor
@Transactional
class AuthServiceImplementation implements AuthService {
    private final FollowRepository followRepository;
    private final BlockService blockService;
    private final AuthRepository userRepository;
    private final OTPRepository otpRepository;
    private final AuthMapper authMapper;
    private final JavaMailSender mailSender;
    private final BCryptPasswordEncoder passwordEncoder;

    @PersistenceContext
    private EntityManager entityManager;

    private static final String JU_EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@ju\\.edu\\.jo$";
    private static final int OTP_EXPIRY_MINUTES = 3;
    private static final String FROM_EMAIL = "julink2026@gmail.com";
    private static final String OTP_TEMPLATE_PATH = "templates/email/otp.html";

    @Override
    public void createUser(AuthDTOs.CreateUserRequestDTO dto) {
        validateCreateUserRequest(dto);

        AuthEntities.User user = authMapper.toEntity(dto);
        user.setEmailVerified(false);
        userRepository.save(user);
        followRepository.createUser(user.getUsername());
        sendOTP(user.getEmail());
        System.out.println("User created successfully: " + user.getEmail());
    }

    @Override
    public void sendOTP(String email) {
        String cleanedEmail = cleanEmail(email);
        String otpCode = generateOTP();

        deleteExistingOTP(cleanedEmail);
        saveOTP(cleanedEmail, otpCode);
        sendOtpEmail(
                cleanedEmail,
                otpCode,
                "JUlink Account Verification OTP",
                "Verify your email address",
                "Use the verification code below to complete your JUlink account verification."
        );

        System.out.println("OTP sent successfully to: " + cleanedEmail);
    }

    @Override
    public void verifyOTP(String otp, String email) {
        String cleanedEmail = cleanEmail(email);

        validateAndDeleteOTP(cleanedEmail, otp);

        AuthEntities.User user = findUserByEmail(cleanedEmail);
        user.setEmailVerified(true);
        userRepository.save(user);

        System.out.println("OTP verified successfully for: " + cleanedEmail);
    }

    @Override
    public Authentication loginUser(AuthDTOs.LoginUserDTO loginUserDTO) {
        String identifier = cleanLoginIdentifier(loginUserDTO.identifier());

        AuthEntities.User user;
        try {
            user = findUserForLogin(identifier);
        } catch (RuntimeException e) {
            // Perform dummy bcrypt check to prevent timing attacks when user is not found
            passwordEncoder.matches(loginUserDTO.password(), "$2a$10$dXJ3ADSpYg16v3EXv15Cee6v1Pq75E6XGZQuz1/Rcx.R4X9C8rU/S");
            throw e;
        }

        validatePassword(loginUserDTO.password(), user.getPasswordHash());
        validateEmailVerified(user);

        return createAuthenticationToken(user);
    }

    @Override
    public void kill(Principal principal) {
        deleteAccount(authenticatedUser(principal));
    }

    @Override
    public void sendDeleteOTP(Principal principal) {
        AuthEntities.User user = authenticatedUser(principal);
        String email = cleanEmail(user.getEmail());
        String otpCode = generateOTP();

        deleteExistingOTP(email);
        saveOTP(email, otpCode);
        sendOtpEmail(
                email,
                otpCode,
                "JUlink Account Deletion OTP",
                "Confirm account deletion",
                "Use the verification code below to confirm your JULink account deletion request."
        );
    }

    @Override
    public void killWithOTP(Principal principal, AuthDTOs.DeleteAccountOTPDTO dto) {
        AuthEntities.User user = authenticatedUser(principal);
        validateAndDeleteOTP(cleanEmail(user.getEmail()), dto.otp());
        deleteAccount(user);
    }

    @Override
    public void changePassword(Principal principal, AuthDTOs.ChangePasswordDTO dto) {
        AuthEntities.User user = authenticatedUser(principal);
        validatePassword(dto.currentPassword(), user.getPasswordHash());
        validateNewPassword(dto.newPassword());
        user.setPasswordHash(passwordEncoder.encode(dto.newPassword()));
        userRepository.save(user);
    }

    @Override
    public void sendForgotPasswordOTP(AuthDTOs.ForgotPasswordOTPDTO dto) {
        String email = cleanEmail(dto.email());
        validateJuEmail(email);
        findUserByEmail(email);

        String otpCode = generateOTP();
        deleteExistingOTP(email);
        saveOTP(email, otpCode);
        sendOtpEmail(
                email,
                otpCode,
                "JUlink Password Reset OTP",
                "Reset your password",
                "Use the verification code below to reset your JUlink account password."
        );
    }

    @Override
    public void resetPasswordWithOTP(AuthDTOs.ResetPasswordDTO dto) {
        String email = cleanEmail(dto.email());
        validateJuEmail(email);
        validateNewPassword(dto.newPassword());
        validateAndDeleteOTP(email, dto.otp());

        AuthEntities.User user = findUserByEmail(email);
        user.setPasswordHash(passwordEncoder.encode(dto.newPassword()));
        userRepository.save(user);
    }

    private void deleteAccount(AuthEntities.User user) {
        String email = cleanEmail(user.getEmail());
        Long userId = user.getId();
        String username = user.getUsername();

        deleteUserChatData(userId);
        deleteUserPostData(userId);
        deleteUserLostAndFounds(userId);
        blockService.deleteAllForUser(userId);
        deleteExistingOTP(email);
        followRepository.deleteUser(username);
        userRepository.delete(user);
    }

    private void validateCreateUserRequest(AuthDTOs.CreateUserRequestDTO dto) {
        String username = dto.username().toLowerCase();
        String email = dto.email().toLowerCase();

        validateJuEmail(email);

        if (userRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username '" + username + "' already exists");
        }

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email '" + email + "' already exists");
        }
    }

    private String cleanEmail(String email) {
        if (email == null) {
            return "";
        }
        return email.toLowerCase().trim();
    }

    private String cleanLoginIdentifier(String identifier) {
        return identifier.toLowerCase().trim();
    }

    private void validateJuEmail(String email) {
        if (email == null || !email.matches(JU_EMAIL_REGEX)) {
            throw new IllegalArgumentException("Email must end with @ju.edu.jo");
        }
    }

    private String generateOTP() {
        return String.format("%06d", (int) (Math.random() * 1000000));
    }

    private void deleteExistingOTP(String email) {
        if (otpRepository.existsByEmail(email)) {
            otpRepository.deleteByEmailIgnoreCase(email);
        }
    }

    private void sendOtpEmail(String email, String otp, String subject, String purposeTitle, String purposeText) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(FROM_EMAIL);
            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(renderOtpTemplate(otp, purposeTitle, purposeText), true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }

    private String renderOtpTemplate(String otp, String purposeTitle, String purposeText) throws Exception {
        ClassPathResource template = new ClassPathResource(OTP_TEMPLATE_PATH);
        String html = StreamUtils.copyToString(template.getInputStream(), StandardCharsets.UTF_8);
        return html
                .replace("{{purposeTitle}}", purposeTitle)
                .replace("{{purposeText}}", purposeText)
                .replace("{{otp}}", otp)
                .replace("{{expiryMinutes}}", String.valueOf(OTP_EXPIRY_MINUTES));
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

    private void validateAndDeleteOTP(String email, String providedOtp) {
        AuthEntities.OTP otpEntity = findValidOTP(email);
        validateOTP(otpEntity, providedOtp);
        deleteVerifiedOTP(email);
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

    private void deleteUserChatData(Long userId) {
        executeUpdate("""
                DELETE FROM message_read_receipts
                WHERE user_id = :userId
                """, userId);
        executeUpdate("""
                DELETE FROM message_read_receipts
                WHERE message_id IN (
                    SELECT id FROM messages WHERE sender_id = :userId
                )
                """, userId);
        executeUpdate("""
                DELETE FROM messages
                WHERE sender_id = :userId
                """, userId);
        executeUpdate("""
                DELETE FROM conversation_members
                WHERE user_id = :userId
                """, userId);
    }

    private void deleteUserPostData(Long userId) {
        executeUpdate("""
                DELETE FROM post_impressions
                WHERE user_id = :userId
                """, userId);
        executeUpdate("""
                DELETE FROM post_impressions
                WHERE post_id IN (
                    SELECT post_id FROM posts WHERE owner_id = :userId
                )
                """, userId);
        executeUpdate("""
                DELETE FROM comment_likes
                WHERE user_id = :userId
                """, userId);
        executeUpdate("""
                DELETE FROM comment_likes
                WHERE comment_id IN (
                    SELECT comment_id
                    FROM post_comments
                    WHERE post_id IN (
                        SELECT post_id FROM posts WHERE owner_id = :userId
                    )
                )
                """, userId);
        executeUpdate("""
                DELETE FROM post_likes
                WHERE user_id = :userId
                """, userId);
        executeUpdate("""
                DELETE FROM post_favorites
                WHERE user_id = :userId
                """, userId);
        executeUpdate("""
                DELETE FROM post_likes
                WHERE post_id IN (
                    SELECT post_id FROM posts WHERE owner_id = :userId
                )
                """, userId);
        executeUpdate("""
                DELETE FROM post_favorites
                WHERE post_id IN (
                    SELECT post_id FROM posts WHERE owner_id = :userId
                )
                """, userId);

        executeUpdate("""
                WITH RECURSIVE comments_to_delete AS (
                    SELECT comment_id
                    FROM post_comments
                    WHERE user_id = :userId
                    UNION ALL
                    SELECT reply.comment_id
                    FROM post_comments reply
                    JOIN comments_to_delete parent
                        ON reply.parent_comment_id = parent.comment_id
                )
                DELETE FROM comment_likes
                WHERE comment_id IN (
                    SELECT comment_id FROM comments_to_delete
                )
                """, userId);
        executeUpdate("""
                WITH RECURSIVE comments_to_delete AS (
                    SELECT comment_id
                    FROM post_comments
                    WHERE user_id = :userId
                    UNION ALL
                    SELECT reply.comment_id
                    FROM post_comments reply
                    JOIN comments_to_delete parent
                        ON reply.parent_comment_id = parent.comment_id
                )
                DELETE FROM post_comments
                WHERE comment_id IN (
                    SELECT comment_id FROM comments_to_delete
                )
                """, userId);

        executeUpdate("""
                DELETE FROM post_comments
                WHERE post_id IN (
                    SELECT post_id FROM posts WHERE owner_id = :userId
                )
                """, userId);
        executeUpdate("""
                DELETE FROM post_attachments
                WHERE post_id IN (
                    SELECT post_id FROM posts WHERE owner_id = :userId
                )
                """, userId);
        executeUpdate("""
                DELETE FROM post_hashtags
                WHERE post_id IN (
                    SELECT post_id FROM posts WHERE owner_id = :userId
                )
                """, userId);
        executeUpdate("""
                DELETE FROM posts
                WHERE owner_id = :userId
                """, userId);
    }

    private void deleteUserLostAndFounds(Long userId) {
        executeUpdate("""
                DELETE FROM lost_and_founds
                WHERE owner_id = :userId
                """, userId);
    }

    private void executeUpdate(String sql, Long userId) {
        entityManager.createNativeQuery(sql)
                .setParameter("userId", userId)
                .executeUpdate();
    }

    private AuthEntities.User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    private AuthEntities.User authenticatedUser(Principal principal) {
        if (principal == null) {
            throw new RuntimeException("Authenticated user is required");
        }
        return findUserByEmail(cleanEmail(principal.getName()));
    }

    private AuthEntities.User findUserForLogin(String identifier) {
        return userRepository.findByEmailOrUsername(identifier, identifier)
                .orElseThrow(() -> new RuntimeException("User not found with email or username: " + identifier));
    }

    private void validatePassword(String rawPassword, String encodedPassword) {
        if (!passwordEncoder.matches(rawPassword, encodedPassword)) {
            throw new RuntimeException("Invalid password");
        }
    }

    private void validateNewPassword(String newPassword) {
        if (newPassword == null || newPassword.isBlank() || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
    }

    private void validateEmailVerified(AuthEntities.User user) {
        if (Boolean.FALSE.equals(user.getEmailVerified())) {
            throw new RuntimeException("Please verify your email before logging in");
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

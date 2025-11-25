package com.example.Julink.service;

import com.example.Julink.dto.CreateUserRequestDTO;
import com.example.Julink.dto.LoginUserDTO;
import com.example.Julink.dto.OTPDTO;
import com.example.Julink.entity.OTP;
import com.example.Julink.entity.User;
import com.example.Julink.mapper.UserMapper;
import com.example.Julink.reposotiry.OTPRepo;
import com.example.Julink.reposotiry.UserRepo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    @Autowired
    private final UserRepo userRepo;
    @Autowired
    private final UserMapper userMapper;
    @Autowired
    private final JavaMailSender javaMailSender;
    @Autowired
    private final OTPRepo otpRepo;
    @Autowired
    private final PasswordEncoder passwordEncoder;

    private static final String JU_EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@ju\\.edu\\.jo$";

    @Override
    @Transactional
    public void createUser(CreateUserRequestDTO dto) {
        String username = dto.username().toLowerCase();
        String email = dto.email().toLowerCase();

        if (!email.matches(JU_EMAIL_REGEX))
            throw new IllegalArgumentException("Email must end with @ju.edu.jo");

        if (userRepo.existsByUsername(username))
            throw new IllegalArgumentException("Username already exists");

        if (userRepo.existsByEmail(email))
            throw new IllegalArgumentException("Email already exists");

        User user = userMapper.toEntity(dto);
        userRepo.save(user);
        //logs
        System.out.println("User created User Email: " + user.getEmail());
    }

    @Transactional
    @Override
    public void sendOTP(String email) {
        String otp = otpGenerator();
        //    generalOTP = otp;
        email = email.toLowerCase().trim();
        if (otpRepo.existsByEmail(email))
            otpRepo.deleteByEmailIgnoreCase(email);
        sendEmail(email, otp);


        OTPDTO otpdto = new OTPDTO(email, otp);
        OTP OTPclass = userMapper.toOTP(otpdto);
        OTPclass.setOtp(otp);
        OTPclass.setEmail(email);
        OTPclass.setExpiresAt(LocalDateTime.now().plusMinutes(3));
        otpRepo.save(OTPclass);
    }

    @Transactional
    @Override
    public void verifyOTP(String otp, String email) {
        User user = userRepo.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("No OTP found for this email"));
        OTP otpEntity = otpRepo.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("No OTP found for this email"));


        if (otpEntity.getOtp().equals(otp)) {
            if(LocalDateTime.now().isAfter(otpEntity.getExpiresAt())) {
                userRepo.deleteByEmail(email);

            }
            System.out.println("Valid OTP");
        }
        else {
            throw new RuntimeException("Invalid OTP, the given otp is incorrect");
        }
        //        if (otpEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
        //            throw new RuntimeException("Invalid OTP, the expiration date is after the current date");
        //        }


    }

    @Transactional
    @Override
    public void loginUser(LoginUserDTO dto) {
        String email = dto.email().toLowerCase().trim();
        String password = dto.password();

        User user = userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new RuntimeException("Invalid password");
        }
        System.out.println("Login successful for user" + user.getUsername());

    }

    //helper functions
    private void sendEmail(String email, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("ahmadalmanasrah204@gmail.com");
        message.setTo(email);
        message.setSubject("OTP For JUlink account");
        message.setText("Hello, this is your otp: "+otp +" for JUlink account");
        javaMailSender.send(message);
    }
    private String otpGenerator() {
        return String.valueOf(100000 + (int)(Math.random() * 900000));
    }
}

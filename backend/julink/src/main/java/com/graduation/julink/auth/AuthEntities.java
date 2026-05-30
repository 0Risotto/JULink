package com.graduation.julink.auth;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

public final class AuthEntities {
    private AuthEntities() {} // Prevent instantiation

    @Entity
    @Setter
    @Getter
    @Table(name = "users")
    public static class User {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false, unique = true)
        private String username;

        @Column(nullable = false, unique = true)
        private String email;

        @Column(nullable = false)
        private String firstName;

        @Column(nullable = false)
        private String lastName;

        @Column(nullable = false)
        private String college;

        @Column(nullable = false)
        private String passwordHash;

        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt = LocalDateTime.now();

        @Column(name = "banner_photo_url")
        private String bannerPhotoUrl;

        @Column(name = "profile_picture_url")
        private String profilePictureUrl;

        @Column(length = 500)
        private String bio;

        @Enumerated(EnumType.STRING)
        @Column(name = "theme_preference", nullable = false, length = 20)
        private ThemePreference themePreference = ThemePreference.SYSTEM;

        @Column(nullable = false, columnDefinition = "boolean default true")
        private boolean isFirstLogin = true;

        @Column(name = "email_verified")
        private Boolean emailVerified;


        // @OneToOne(mappedBy = "user", cascade = CascadeType.REMOVE, orphanRemoval = true)
        // private OTP otp;
    }

    @Entity
    @Setter
    @Getter
    @Table(name = "OTP")
    public static class OTP {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @Column(nullable = false)
        private String otp;

        @Column(nullable = false)
        private String email;

        @Column(nullable = false)
        private LocalDateTime expiresAt;

        // If you want the relationship from OTP side
        // @ManyToOne
        // @JoinColumn(name = "user_id")
        // private User user;
    }
}

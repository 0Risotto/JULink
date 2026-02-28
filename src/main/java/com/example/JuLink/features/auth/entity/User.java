package com.example.JuLink.features.auth.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Setter
@Getter
@Table(name = "users")
public class User {

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

//    @OneToOne(mappedBy = "users", cascade = CascadeType.REMOVE, orphanRemoval = true)
//    OTP otp;
//    @Column(nullable = false)
//    private boolean verified = false;
}

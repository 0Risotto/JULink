package com.graduation.julink.auth;


import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;


public final class AuthDTOs {
    private AuthDTOs() {} // Prevent instantiation

    public record CreateUserRequestDTO(
            @NotBlank @Size(min = 3, max = 50)
            String username,
            @NotBlank @Email
            String email,
            @NotBlank
            String firstName,
            @NotBlank
            String lastName,
            @NotNull
            CollegeEnum college,
            @NotBlank
            String password) {
    }

    public record LoginUserDTO(
            @JsonAlias({"email", "username"})
            @NotBlank
            String identifier,
            @NotBlank
            String password
    ) {}

    public record  OTPDTO(String otp, String email){}

    public record SendOTPDTO(String email){}

}

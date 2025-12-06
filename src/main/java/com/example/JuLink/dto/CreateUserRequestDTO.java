package com.example.JuLink.dto;

import com.example.JuLink.enums.College;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

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
        College college,
        @NotBlank
        String password) {
}

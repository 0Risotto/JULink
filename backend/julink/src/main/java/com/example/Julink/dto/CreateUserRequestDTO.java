package com.example.Julink.dto;
import com.example.Julink.enums.College;
import jakarta.validation.constraints.*;

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

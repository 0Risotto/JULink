package com.graduation.julink.lostandfound;

import com.graduation.julink.auth.CollegeEnum;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.UUID;

public class LostAndFoundDto {

    public record CreateLostAndFound(
            @NotBlank String description,
            @NotNull CollegeEnum college,
            @NotBlank String imageURL,
            String phoneNumber,
            boolean isFound
    ) {}

    public record Response(
            UUID id,
            Long ownerId,
            String description,
            CollegeEnum college,
            String imageURL,
            String phoneNumber,
            boolean isFound,
            LocalDateTime createdAt
    ) {}

    public record Request(
            UUID requestId,
            UUID lostAndFoundId,
            Long senderId,
            String message,
            LocalDateTime sentAt
    ) {}
}

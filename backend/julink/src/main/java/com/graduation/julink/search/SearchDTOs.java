package com.graduation.julink.search;

import java.time.LocalDateTime;
import java.util.UUID;

public final class SearchDTOs {
    private SearchDTOs() {}

    public record UserSearchResultDTO(
            Long id,
            String username,
            String firstName,
            String lastName,
            String profilePictureUrl,
            String college
    ) {}

    public record PostSearchResultDTO(
            UUID postId,
            Long ownerId,
            String ownerUsername,
            String ownerFirstName,
            String ownerLastName,
            String ownerProfilePictureUrl,
            String description,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {}

    public record HashtagSearchResultDTO(
            UUID hashtagId,
            String name
    ) {}
}

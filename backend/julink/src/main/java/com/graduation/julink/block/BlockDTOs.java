package com.graduation.julink.block;

import java.time.LocalDateTime;

public final class BlockDTOs {
    private BlockDTOs() {}

    public record BlockedUserDto(
            String username,
            String fullName,
            String profilePictureUrl,
            LocalDateTime blockedAt
    ) {}

    public record BlockStatusDto(
            boolean blockedByMe,
            boolean blockedMe,
            boolean blockedEitherWay
    ) {}
}

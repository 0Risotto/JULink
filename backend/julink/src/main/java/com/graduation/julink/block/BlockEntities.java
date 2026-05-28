package com.graduation.julink.block;

import com.graduation.julink.auth.AuthEntities.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

public final class BlockEntities {
    private BlockEntities() {}

    @Entity(name = "UserBlock")
    @Getter
    @Setter
    @Table(
            name = "user_blocks",
            uniqueConstraints = {
                    @UniqueConstraint(columnNames = {"blocker_id", "blocked_id"})
            },
            indexes = {
                    @Index(name = "idx_user_blocks_blocker", columnList = "blocker_id"),
                    @Index(name = "idx_user_blocks_blocked", columnList = "blocked_id")
            }
    )
    public static class UserBlock {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private Long id;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "blocker_id", nullable = false)
        private User blocker;

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "blocked_id", nullable = false)
        private User blocked;

        @Column(nullable = false, updatable = false)
        private LocalDateTime createdAt = LocalDateTime.now();
    }
}

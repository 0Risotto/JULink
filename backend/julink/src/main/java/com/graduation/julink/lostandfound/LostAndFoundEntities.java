package com.graduation.julink.lostandfound;


import com.graduation.julink.auth.CollegeEnum;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;


public final class LostAndFoundEntities {

    @Entity
    @Setter
    @Getter
    @Table(name = "lost_and_founds")
    public static class LostAndFound {

        @Id
        @GeneratedValue(strategy = GenerationType.UUID)
        private UUID id;

        @Column(name = "owner_id", nullable = false)
        private Long ownerId;

        @Column(columnDefinition = "TEXT")
        private String description;

        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private CollegeEnum college;

        @Column(name = "image_url")
        private String imageURL;

        @Column(name = "phone_number", length = 20)
        private String phoneNumber;

        @Column(nullable = false)
        private boolean found;

        @Column(name = "created_at", nullable = false, updatable = false)
        private java.time.LocalDateTime createdAt = java.time.LocalDateTime.now();
    }
}

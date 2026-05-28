package com.graduation.julink.lostandfound;

import com.graduation.julink.auth.CollegeEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.notification.NotificationDTOs;
import com.graduation.julink.notification.NotificationService;
import com.graduation.julink.notification.NotificationType;

@Service
@RequiredArgsConstructor
public class LostAndFoundService {

    private final LostAndFoundRepository lostAndFoundRepository;
    private final AuthRepository authRepository;
    private final NotificationService notificationService;

    public LostAndFoundDto.Response addLostAndFound(LostAndFoundDto.CreateLostAndFound dto, Long userId) {
        LostAndFoundEntities.LostAndFound entity = new LostAndFoundEntities.LostAndFound();
        entity.setDescription(dto.description());
        entity.setCollege(dto.college());
        entity.setImageURL(dto.imageURL());
        entity.setPhoneNumber(dto.phoneNumber());
        entity.setType(dto.type());
        entity.setResolved(false);
        entity.setOwnerId(userId);
        LostAndFoundEntities.LostAndFound savedEntity = lostAndFoundRepository.save(entity);

        AuthEntities.User owner = authRepository.findById(savedEntity.getOwnerId()).orElse(null);
        String ownerUsername = owner != null ? owner.getUsername() : "Unknown";
        String ownerProfilePicture = owner != null ? owner.getProfilePictureUrl() : null;
        notifySameCollegeUsers(savedEntity, owner);

        return new LostAndFoundDto.Response(
                savedEntity.getId(),
                savedEntity.getOwnerId(),
                ownerUsername,
                ownerProfilePicture,
                savedEntity.getDescription(),
                savedEntity.getCollege(),
                savedEntity.getImageURL(),
                savedEntity.getPhoneNumber(),
                savedEntity.getType(),
                savedEntity.isResolved(),
                savedEntity.getCreatedAt()
        );
    }

    @Transactional
    public LostAndFoundDto.ClaimResponse claimLostAndFound(
            UUID lostAndFoundId,
            Long claimantId,
            LostAndFoundDto.ClaimRequest request
    ) {
        LostAndFoundEntities.LostAndFound lostAndFound = lostAndFoundRepository.findById(lostAndFoundId)
                .orElseThrow(() -> new RuntimeException("Lost and found post not found"));

        if (lostAndFound.isResolved()) {
            throw new RuntimeException("Cannot claim a resolved lost and found post.");
        }
        if (lostAndFound.getOwnerId().equals(claimantId)) {
            throw new RuntimeException("You cannot claim your own lost and found post.");
        }

        AuthEntities.User owner = authRepository.findById(lostAndFound.getOwnerId())
                .orElseThrow(() -> new RuntimeException("Lost and found owner not found"));
        AuthEntities.User claimant = authRepository.findById(claimantId)
                .orElseThrow(() -> new RuntimeException("Claimant not found"));

        String message = normalizeClaimMessage(request == null ? null : request.message());
        NotificationDTOs.NotificationResponse notification = notifyLostAndFoundOwner(lostAndFound, owner, claimant, message);

        return new LostAndFoundDto.ClaimResponse(
                "success",
                notification == null ? null : notification.id(),
                lostAndFound.getId(),
                claimant.getId(),
                owner.getId(),
                message
        );
    }

    @Transactional
    public LostAndFoundDto.Response markAsResolved(UUID lostAndFoundId, Long userId) {
        LostAndFoundEntities.LostAndFound lostAndFound = lostAndFoundRepository.findById(lostAndFoundId)
                .orElseThrow(() -> new RuntimeException("Lost and found post not found"));

        if (!lostAndFound.getOwnerId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You don't own this post.");
        }

        lostAndFound.setResolved(true);
        LostAndFoundEntities.LostAndFound updatedLostAndFound = lostAndFoundRepository.save(lostAndFound);

        AuthEntities.User owner = authRepository.findById(updatedLostAndFound.getOwnerId()).orElse(null);
        String ownerUsername = owner != null ? owner.getUsername() : "Unknown";
        String ownerProfilePicture = owner != null ? owner.getProfilePictureUrl() : null;

        return new LostAndFoundDto.Response(
                updatedLostAndFound.getId(),
                updatedLostAndFound.getOwnerId(),
                ownerUsername,
                ownerProfilePicture,
                updatedLostAndFound.getDescription(),
                updatedLostAndFound.getCollege(),
                updatedLostAndFound.getImageURL(),
                updatedLostAndFound.getPhoneNumber(),
                updatedLostAndFound.getType(),
                updatedLostAndFound.isResolved(),
                updatedLostAndFound.getCreatedAt()
        );
    }

    private LostAndFoundDto.Response mapToResponse(LostAndFoundEntities.LostAndFound entity) {
        AuthEntities.User owner = authRepository.findById(entity.getOwnerId()).orElse(null);
        String ownerUsername = owner != null ? owner.getUsername() : "Unknown";
        String ownerProfilePicture = owner != null ? owner.getProfilePictureUrl() : null;

        return new LostAndFoundDto.Response(
                entity.getId(),
                entity.getOwnerId(),
                ownerUsername,
                ownerProfilePicture,
                entity.getDescription(),
                entity.getCollege(),
                entity.getImageURL(),
                entity.getPhoneNumber(),
                entity.getType(),
                entity.isResolved(),
                entity.getCreatedAt()
        );
    }

    public Page<LostAndFoundDto.Response> getLostAndFounds(CollegeEnum college, TypeEnum type, Boolean isResolved, Pageable pageable) {
        Page<LostAndFoundEntities.LostAndFound> entities;

        if (college != null && type != null && isResolved != null) {
            entities = lostAndFoundRepository.findByCollegeAndTypeAndIsResolved(college, type, isResolved, pageable);
        } else if (college != null && type != null) {
            entities = lostAndFoundRepository.findByCollegeAndType(college, type, pageable);
        } else if (college != null && isResolved != null) {
            entities = lostAndFoundRepository.findByCollegeAndIsResolved(college, isResolved, pageable);
        } else if (type != null && isResolved != null) {
            entities = lostAndFoundRepository.findByTypeAndIsResolved(type, isResolved, pageable);
        } else if (college != null) {
            entities = lostAndFoundRepository.findByCollege(college, pageable);
        } else if (type != null) {
            entities = lostAndFoundRepository.findByType(type, pageable);
        } else if (isResolved != null) {
            entities = lostAndFoundRepository.findByIsResolved(isResolved, pageable);
        } else {
            entities = lostAndFoundRepository.findAll(pageable);
        }

        return entities.map(this::mapToResponse);
    }

    private void notifySameCollegeUsers(LostAndFoundEntities.LostAndFound lostAndFound, AuthEntities.User owner) {
        if (notificationService == null || lostAndFound == null || owner == null) {
            return;
        }
        try {
            notificationService.notifyUsers(
                    authRepository.findByCollege(lostAndFound.getCollege().name()),
                    owner,
                    NotificationType.LOST_AND_FOUND_POSTED,
                    "New " + lostAndFound.getType().name().toLowerCase() + " item posted in " + lostAndFound.getCollege().name(),
                    "LOST_AND_FOUND",
                    lostAndFound.getId().toString(),
                    null
            );
        } catch (RuntimeException ignored) {
            // Notifications should not break lost and found creation.
        }
    }

    private NotificationDTOs.NotificationResponse notifyLostAndFoundOwner(
            LostAndFoundEntities.LostAndFound lostAndFound,
            AuthEntities.User owner,
            AuthEntities.User claimant,
            String message
    ) {
        if (notificationService == null) {
            return null;
        }
        try {
            return notificationService.notifyUser(
                    owner,
                    claimant,
                    NotificationType.LOST_AND_FOUND_CLAIM_REQUESTED,
                    message,
                    "LOST_AND_FOUND",
                    lostAndFound.getId().toString(),
                    "{\"claimantId\":" + claimant.getId() + "}"
            );
        } catch (RuntimeException ignored) {
            // Notifications should not break claim request response.
            return null;
        }
    }

    private String normalizeClaimMessage(String message) {
        if (message == null || message.isBlank()) {
            return "I think this item is mine. Can we talk?";
        }
        return message.trim();
    }
}

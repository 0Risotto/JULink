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

@Service
@RequiredArgsConstructor
public class LostAndFoundService {

    private final LostAndFoundRepository lostAndFoundRepository;
    private final AuthRepository authRepository;

    public LostAndFoundDto.Response addLostAndFound(LostAndFoundDto.CreateLostAndFound dto, Long userId) {
        LostAndFoundEntities.LostAndFound entity = new LostAndFoundEntities.LostAndFound();
        entity.setDescription(dto.description());
        entity.setCollege(dto.college());
        entity.setImageURL(dto.imageURL());
        entity.setPhoneNumber(dto.phoneNumber());
        entity.setFound(dto.isFound());
        entity.setOwnerId(userId);
        LostAndFoundEntities.LostAndFound savedEntity = lostAndFoundRepository.save(entity);

        String ownerUsername = authRepository.findById(savedEntity.getOwnerId())
                .map(AuthEntities.User::getUsername)
                .orElse("Unknown");

        return new LostAndFoundDto.Response(
                savedEntity.getId(),
                savedEntity.getOwnerId(),
                ownerUsername,
                savedEntity.getDescription(),
                savedEntity.getCollege(),
                savedEntity.getImageURL(),
                savedEntity.getPhoneNumber(),
                savedEntity.isFound(),
                savedEntity.getCreatedAt()
        );
    }

    @Transactional
    public LostAndFoundDto.Response markAsFound(UUID lostAndFoundId, Long userId) {
        LostAndFoundEntities.LostAndFound lostAndFound = lostAndFoundRepository.findById(lostAndFoundId)
                .orElseThrow(() -> new RuntimeException("Lost and found post not found"));

        if (!lostAndFound.getOwnerId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You don't own this post.");
        }

        lostAndFound.setFound(true);
        LostAndFoundEntities.LostAndFound updatedLostAndFound = lostAndFoundRepository.save(lostAndFound);

        String ownerUsername = authRepository.findById(updatedLostAndFound.getOwnerId())
                .map(AuthEntities.User::getUsername)
                .orElse("Unknown");

        return new LostAndFoundDto.Response(
                updatedLostAndFound.getId(),
                updatedLostAndFound.getOwnerId(),
                ownerUsername,
                updatedLostAndFound.getDescription(),
                updatedLostAndFound.getCollege(),
                updatedLostAndFound.getImageURL(),
                updatedLostAndFound.getPhoneNumber(),
                updatedLostAndFound.isFound(),
                updatedLostAndFound.getCreatedAt()
        );
    }
    private LostAndFoundDto.Response mapToResponse(LostAndFoundEntities.LostAndFound entity) {
        String ownerUsername = authRepository.findById(entity.getOwnerId())
                .map(AuthEntities.User::getUsername)
                .orElse("Unknown");

        return new LostAndFoundDto.Response(
                entity.getId(),
                entity.getOwnerId(),
                ownerUsername,
                entity.getDescription(),
                entity.getCollege(),
                entity.getImageURL(),
                entity.getPhoneNumber(),
                entity.isFound(),
                entity.getCreatedAt()
        );
    }
    public Page<LostAndFoundDto.Response> getLostAndFounds(CollegeEnum college, Boolean isResolved, Pageable pageable) {
        Page<LostAndFoundEntities.LostAndFound> entities;

        if (college != null && isResolved != null) {
            entities = lostAndFoundRepository.findByCollegeAndFound(college, isResolved, pageable);
        } else if (college != null) {
            entities = lostAndFoundRepository.findByCollege(college, pageable);
        } else if (isResolved != null) {
            entities = lostAndFoundRepository.findByFound(isResolved, pageable);
        } else {
            entities = lostAndFoundRepository.findAll(pageable);
        }

        return entities.map(this::mapToResponse);
    }
}

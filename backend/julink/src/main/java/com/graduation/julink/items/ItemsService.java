package com.graduation.julink.items;

import com.graduation.julink.auth.CollegeEnum;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItemsService {

    private final ItemsRepository itemsRepository;

    public ItemsDto.Response addItem(ItemsDto.CreateItem dto, Long userId) {
        ItemEntities.ItemEntity entity = new ItemEntities.ItemEntity();
        entity.setDescription(dto.description());
        entity.setCollege(dto.college());
        entity.setImageURL(dto.imageURL());
        entity.setPhoneNumber(dto.phoneNumber());
        entity.setFound(dto.isFound());
        entity.setOwnerId(userId);
        ItemEntities.ItemEntity savedEntity = itemsRepository.save(entity);

        return new ItemsDto.Response(
                savedEntity.getId(),
                savedEntity.getOwnerId(),
                savedEntity.getDescription(),
                savedEntity.getCollege(),
                savedEntity.getImageURL(),
                savedEntity.getPhoneNumber(),
                savedEntity.isFound(),
                savedEntity.getCreatedAt()
        );
    }

    @Transactional
    public ItemsDto.Response markAsFound(UUID itemId, Long userId) {
        ItemEntities.ItemEntity item = itemsRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found"));

        if (!item.getOwnerId().equals(userId)) {
            throw new RuntimeException("Unauthorized: You don't own this post.");
        }

        item.setFound(true);
        ItemEntities.ItemEntity updatedItem = itemsRepository.save(item);

        return new ItemsDto.Response(
                updatedItem.getId(),
                updatedItem.getOwnerId(),
                updatedItem.getDescription(),
                updatedItem.getCollege(),
                updatedItem.getImageURL(),
                updatedItem.getPhoneNumber(),
                updatedItem.isFound(),
                updatedItem.getCreatedAt()
        );
    }
    private ItemsDto.Response mapToResponse(ItemEntities.ItemEntity entity) {
        return new ItemsDto.Response(
                entity.getId(),
                entity.getOwnerId(),
                entity.getDescription(),
                entity.getCollege(),
                entity.getImageURL(),
                entity.getPhoneNumber(),
                entity.isFound(),
                entity.getCreatedAt()
        );
    }
    public Page<ItemsDto.Response> getItems(CollegeEnum college, boolean isResolved, Pageable pageable) {
        Page<ItemEntities.ItemEntity> entities;

        if (college != null) {

            entities = itemsRepository.findByCollegeAndFound(college, isResolved, pageable);
        } else {

            entities = itemsRepository.findByFound(isResolved, pageable);
        }

        return entities.map(this::mapToResponse);
    }
}

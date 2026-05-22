package com.graduation.julink.items;

import com.graduation.julink.auth.CollegeEnum;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ItemsServiceTest {

    @Mock
    private ItemsRepository itemsRepository;

    @InjectMocks
    private ItemsService itemsService;

    private ItemEntities.ItemEntity item;
    private UUID itemId;

    @BeforeEach
    void setUp() {
        itemId = UUID.randomUUID();
        item = new ItemEntities.ItemEntity();
        item.setId(itemId);
        item.setOwnerId(101L);
        item.setDescription("description");
        item.setCollege(CollegeEnum.KING_ABDULLAH_II_IT);
        item.setFound(false);
    }

    @Test
    void addItem_Success() {
        ItemsDto.CreateItem req = new ItemsDto.CreateItem("description", CollegeEnum.KING_ABDULLAH_II_IT, "url", "123", false);
        when(itemsRepository.save(any(ItemEntities.ItemEntity.class))).thenReturn(item);

        ItemsDto.Response response = itemsService.addItem(req, 101L);

        assertNotNull(response);
        assertEquals(itemId, response.id());
        verify(itemsRepository, times(1)).save(any(ItemEntities.ItemEntity.class));
    }

    @Test
    void markAsFound_Success() {
        when(itemsRepository.findById(itemId)).thenReturn(Optional.of(item));
        when(itemsRepository.save(any(ItemEntities.ItemEntity.class))).thenReturn(item);

        ItemsDto.Response response = itemsService.markAsFound(itemId, 101L);

        assertNotNull(response);
        assertTrue(response.isFound()); // because it was updated
        verify(itemsRepository, times(1)).save(item);
    }

    @Test
    void markAsFound_Unauthorized_ThrowsException() {
        when(itemsRepository.findById(itemId)).thenReturn(Optional.of(item));

        RuntimeException exception = assertThrows(RuntimeException.class, 
                () -> itemsService.markAsFound(itemId, 999L)); // wrong user
        assertEquals("Unauthorized: You don't own this post.", exception.getMessage());
    }

    @Test
    void getItems_WithCollege_Success() {
        Page<ItemEntities.ItemEntity> page = new PageImpl<>(Collections.singletonList(item));
        when(itemsRepository.findByCollegeAndFound(eq(CollegeEnum.KING_ABDULLAH_II_IT), eq(false), any(Pageable.class))).thenReturn(page);

        Page<ItemsDto.Response> response = itemsService.getItems(CollegeEnum.KING_ABDULLAH_II_IT, false, Pageable.unpaged());

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
    }

    @Test
    void getItems_WithoutCollege_Success() {
        Page<ItemEntities.ItemEntity> page = new PageImpl<>(Collections.singletonList(item));
        when(itemsRepository.findByFound(eq(false), any(Pageable.class))).thenReturn(page);

        Page<ItemsDto.Response> response = itemsService.getItems(null, false, Pageable.unpaged());

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
    }
}

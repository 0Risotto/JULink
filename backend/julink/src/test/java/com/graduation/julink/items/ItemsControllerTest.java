package com.graduation.julink.items;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.CollegeEnum;
import com.graduation.julink.auth.Repository.AuthRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ItemsControllerTest {

    @Mock
    private ItemsService itemsService;

    @Mock
    private AuthRepository authRepository;

    @Mock
    private Principal principal;

    @InjectMocks
    private ItemsController itemsController;

    private AuthEntities.User user;
    private String email = "test@ju.edu.jo";

    @BeforeEach
    void setUp() {
        user = new AuthEntities.User();
        user.setId(101L);
        user.setEmail(email);
    }

    private void mockPrincipal() {
        when(principal.getName()).thenReturn(email);
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
    }

    @Test
    void createItem_Success() {
        mockPrincipal();
        ItemsDto.CreateItem req = new ItemsDto.CreateItem("description", CollegeEnum.KING_ABDULLAH_II_IT, "url", "123", false);
        ItemsDto.Response resp = new ItemsDto.Response(UUID.randomUUID(), 101L, "desc", CollegeEnum.KING_ABDULLAH_II_IT, "url", "123", false, null);
        
        when(itemsService.addItem(req, 101L)).thenReturn(resp);

        ResponseEntity<ItemsDto.Response> response = itemsController.createItem(req, principal);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(resp, response.getBody());
    }

    @Test
    void markItemAsFound_Success() {
        mockPrincipal();
        UUID itemId = UUID.randomUUID();
        ItemsDto.Response resp = new ItemsDto.Response(itemId, 101L, "desc", CollegeEnum.KING_ABDULLAH_II_IT, "url", "123", true, null);
        
        when(itemsService.markAsFound(itemId, 101L)).thenReturn(resp);

        ResponseEntity<ItemsDto.Response> response = itemsController.markItemAsFound(itemId, principal);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(resp, response.getBody());
    }

    @Test
    void getAllItems_Success() {
        Page<ItemsDto.Response> page = new PageImpl<>(Collections.emptyList());
        when(itemsService.getItems(eq(CollegeEnum.KING_ABDULLAH_II_IT), eq(false), any(Pageable.class))).thenReturn(page);

        ResponseEntity<Page<ItemsDto.Response>> response = itemsController.getAllItems(CollegeEnum.KING_ABDULLAH_II_IT, false, Pageable.unpaged());

        assertEquals(200, response.getStatusCode().value());
        assertEquals(page, response.getBody());
    }
}

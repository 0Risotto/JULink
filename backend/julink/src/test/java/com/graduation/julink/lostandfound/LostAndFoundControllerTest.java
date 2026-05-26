package com.graduation.julink.lostandfound;

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
class LostAndFoundControllerTest {

    @Mock
    private LostAndFoundService lostAndFoundService;

    @Mock
    private AuthRepository authRepository;

    @Mock
    private Principal principal;

    @InjectMocks
    private LostAndFoundController lostAndFoundController;

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
    void createLostAndFound_Success() {
        mockPrincipal();
        LostAndFoundDto.CreateLostAndFound req = new LostAndFoundDto.CreateLostAndFound("description", CollegeEnum.KING_ABDULLAH_II_IT, "url", "123", false);
        LostAndFoundDto.Response resp = new LostAndFoundDto.Response(UUID.randomUUID(), 101L, "desc", CollegeEnum.KING_ABDULLAH_II_IT, "url", "123", false, null);
        
        when(lostAndFoundService.addLostAndFound(req, 101L)).thenReturn(resp);

        ResponseEntity<LostAndFoundDto.Response> response = lostAndFoundController.createLostAndFound(req, principal);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(resp, response.getBody());
    }

    @Test
    void markLostAndFoundAsFound_Success() {
        mockPrincipal();
        UUID lostAndFoundId = UUID.randomUUID();
        LostAndFoundDto.Response resp = new LostAndFoundDto.Response(lostAndFoundId, 101L, "desc", CollegeEnum.KING_ABDULLAH_II_IT, "url", "123", true, null);
        
        when(lostAndFoundService.markAsFound(lostAndFoundId, 101L)).thenReturn(resp);

        ResponseEntity<LostAndFoundDto.Response> response = lostAndFoundController.markLostAndFoundAsFound(lostAndFoundId, principal);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(resp, response.getBody());
    }

    @Test
    void getAllLostAndFounds_Success() {
        Page<LostAndFoundDto.Response> page = new PageImpl<>(Collections.emptyList());
        when(lostAndFoundService.getLostAndFounds(eq(CollegeEnum.KING_ABDULLAH_II_IT), eq(false), any(Pageable.class))).thenReturn(page);

        ResponseEntity<Page<LostAndFoundDto.Response>> response = lostAndFoundController.getAllLostAndFounds(CollegeEnum.KING_ABDULLAH_II_IT, false, Pageable.unpaged());

        assertEquals(200, response.getStatusCode().value());
        assertEquals(page, response.getBody());
    }
}

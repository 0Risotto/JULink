package com.graduation.julink.lostandfound;

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
class LostAndFoundServiceTest {

    @Mock
    private LostAndFoundRepository lostAndFoundRepository;

    @InjectMocks
    private LostAndFoundService lostAndFoundService;

    private LostAndFoundEntities.LostAndFound lostAndFound;
    private UUID lostAndFoundId;

    @BeforeEach
    void setUp() {
        lostAndFoundId = UUID.randomUUID();
        lostAndFound = new LostAndFoundEntities.LostAndFound();
        lostAndFound.setId(lostAndFoundId);
        lostAndFound.setOwnerId(101L);
        lostAndFound.setDescription("description");
        lostAndFound.setCollege(CollegeEnum.KING_ABDULLAH_II_IT);
        lostAndFound.setFound(false);
    }

    @Test
    void addLostAndFound_Success() {
        LostAndFoundDto.CreateLostAndFound req = new LostAndFoundDto.CreateLostAndFound("description", CollegeEnum.KING_ABDULLAH_II_IT, "url", "123", false);
        when(lostAndFoundRepository.save(any(LostAndFoundEntities.LostAndFound.class))).thenReturn(lostAndFound);

        LostAndFoundDto.Response response = lostAndFoundService.addLostAndFound(req, 101L);

        assertNotNull(response);
        assertEquals(lostAndFoundId, response.id());
        verify(lostAndFoundRepository, times(1)).save(any(LostAndFoundEntities.LostAndFound.class));
    }

    @Test
    void markAsFound_Success() {
        when(lostAndFoundRepository.findById(lostAndFoundId)).thenReturn(Optional.of(lostAndFound));
        when(lostAndFoundRepository.save(any(LostAndFoundEntities.LostAndFound.class))).thenReturn(lostAndFound);

        LostAndFoundDto.Response response = lostAndFoundService.markAsFound(lostAndFoundId, 101L);

        assertNotNull(response);
        assertTrue(response.isFound()); // because it was updated
        verify(lostAndFoundRepository, times(1)).save(lostAndFound);
    }

    @Test
    void markAsFound_Unauthorized_ThrowsException() {
        when(lostAndFoundRepository.findById(lostAndFoundId)).thenReturn(Optional.of(lostAndFound));

        RuntimeException exception = assertThrows(RuntimeException.class, 
                () -> lostAndFoundService.markAsFound(lostAndFoundId, 999L)); // wrong user
        assertEquals("Unauthorized: You don't own this post.", exception.getMessage());
    }

    @Test
    void getLostAndFounds_WithCollege_Success() {
        Page<LostAndFoundEntities.LostAndFound> page = new PageImpl<>(Collections.singletonList(lostAndFound));
        when(lostAndFoundRepository.findByCollegeAndFound(eq(CollegeEnum.KING_ABDULLAH_II_IT), eq(false), any(Pageable.class))).thenReturn(page);

        Page<LostAndFoundDto.Response> response = lostAndFoundService.getLostAndFounds(CollegeEnum.KING_ABDULLAH_II_IT, false, Pageable.unpaged());

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
    }

    @Test
    void getLostAndFounds_WithoutCollege_Success() {
        Page<LostAndFoundEntities.LostAndFound> page = new PageImpl<>(Collections.singletonList(lostAndFound));
        when(lostAndFoundRepository.findByFound(eq(false), any(Pageable.class))).thenReturn(page);

        Page<LostAndFoundDto.Response> response = lostAndFoundService.getLostAndFounds(null, false, Pageable.unpaged());

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
    }
}

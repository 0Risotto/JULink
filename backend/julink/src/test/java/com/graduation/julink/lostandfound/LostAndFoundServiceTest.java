package com.graduation.julink.lostandfound;

import com.graduation.julink.auth.CollegeEnum;
import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.notification.NotificationDTOs;
import com.graduation.julink.notification.NotificationService;
import com.graduation.julink.notification.NotificationType;
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
import java.time.LocalDateTime;

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

    @Mock
    private com.graduation.julink.auth.Repository.AuthRepository authRepository;

    @Mock
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        lostAndFoundId = UUID.randomUUID();
        lostAndFound = new LostAndFoundEntities.LostAndFound();
        lostAndFound.setId(lostAndFoundId);
        lostAndFound.setOwnerId(101L);
        lostAndFound.setDescription("description");
        lostAndFound.setCollege(CollegeEnum.KING_ABDULLAH_II_IT);
        lostAndFound.setType(TypeEnum.LOST);
        lostAndFound.setResolved(false);
    }

    @Test
    void addLostAndFound_Success() {
        LostAndFoundDto.CreateLostAndFound req = new LostAndFoundDto.CreateLostAndFound("description", CollegeEnum.KING_ABDULLAH_II_IT, "url", "123", TypeEnum.LOST);
        when(lostAndFoundRepository.save(any(LostAndFoundEntities.LostAndFound.class))).thenReturn(lostAndFound);
        when(authRepository.findById(any())).thenReturn(Optional.empty());

        LostAndFoundDto.Response response = lostAndFoundService.addLostAndFound(req, 101L);

        assertNotNull(response);
        assertEquals(lostAndFoundId, response.id());
        assertNull(response.ownerProfilePicture());
        verify(lostAndFoundRepository, times(1)).save(any(LostAndFoundEntities.LostAndFound.class));
    }

    @Test
    void markAsResolved_Success() {
        when(lostAndFoundRepository.findById(lostAndFoundId)).thenReturn(Optional.of(lostAndFound));
        when(lostAndFoundRepository.save(any(LostAndFoundEntities.LostAndFound.class))).thenReturn(lostAndFound);
        when(authRepository.findById(any())).thenReturn(Optional.empty());

        LostAndFoundDto.Response response = lostAndFoundService.markAsResolved(lostAndFoundId, 101L);

        assertNotNull(response);
        assertTrue(response.isResolved()); // because it was updated
        verify(lostAndFoundRepository, times(1)).save(lostAndFound);
    }

    @Test
    void markAsResolved_Unauthorized_ThrowsException() {
        when(lostAndFoundRepository.findById(lostAndFoundId)).thenReturn(Optional.of(lostAndFound));

        RuntimeException exception = assertThrows(RuntimeException.class, 
                () -> lostAndFoundService.markAsResolved(lostAndFoundId, 999L)); // wrong user
        assertEquals("Unauthorized: You don't own this post.", exception.getMessage());
    }

    @Test
    void getLostAndFounds_WithCollege_Success() {
        Page<LostAndFoundEntities.LostAndFound> page = new PageImpl<>(Collections.singletonList(lostAndFound));
        when(lostAndFoundRepository.findByCollegeAndIsResolved(eq(CollegeEnum.KING_ABDULLAH_II_IT), eq(false), any(Pageable.class))).thenReturn(page);
        when(authRepository.findById(any())).thenReturn(Optional.empty());

        Page<LostAndFoundDto.Response> response = lostAndFoundService.getLostAndFounds(CollegeEnum.KING_ABDULLAH_II_IT, null, false, Pageable.unpaged());

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
    }

    @Test
    void getLostAndFounds_WithoutCollege_Success() {
        Page<LostAndFoundEntities.LostAndFound> page = new PageImpl<>(Collections.singletonList(lostAndFound));
        when(lostAndFoundRepository.findByIsResolved(eq(false), any(Pageable.class))).thenReturn(page);
        when(authRepository.findById(any())).thenReturn(Optional.empty());

        Page<LostAndFoundDto.Response> response = lostAndFoundService.getLostAndFounds(null, null, false, Pageable.unpaged());

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
    }

    @Test
    void claimLostAndFound_Success_NotifiesOwner() {
        AuthEntities.User owner = new AuthEntities.User();
        owner.setId(101L);
        owner.setUsername("owner");

        AuthEntities.User claimant = new AuthEntities.User();
        claimant.setId(202L);
        claimant.setUsername("claimant");

        UUID notificationId = UUID.randomUUID();
        NotificationDTOs.NotificationResponse notification = new NotificationDTOs.NotificationResponse(
                notificationId,
                "owner",
                "claimant",
                null,
                NotificationType.LOST_AND_FOUND_CLAIM_REQUESTED,
                "This is mine",
                "LOST_AND_FOUND",
                lostAndFoundId.toString(),
                false,
                null,
                LocalDateTime.now()
        );

        when(lostAndFoundRepository.findById(lostAndFoundId)).thenReturn(Optional.of(lostAndFound));
        when(authRepository.findById(101L)).thenReturn(Optional.of(owner));
        when(authRepository.findById(202L)).thenReturn(Optional.of(claimant));
        when(notificationService.notifyUser(eq(owner), eq(claimant), eq(NotificationType.LOST_AND_FOUND_CLAIM_REQUESTED),
                eq("This is mine"), eq("LOST_AND_FOUND"), eq(lostAndFoundId.toString()), any()))
                .thenReturn(notification);

        LostAndFoundDto.ClaimResponse response = lostAndFoundService.claimLostAndFound(
                lostAndFoundId,
                202L,
                new LostAndFoundDto.ClaimRequest("This is mine")
        );

        assertEquals("success", response.status());
        assertEquals(notificationId, response.notificationId());
        assertEquals(101L, response.ownerId());
        assertEquals(202L, response.claimantId());
    }

    @Test
    void claimLostAndFound_OwnerCannotClaimOwnPost() {
        when(lostAndFoundRepository.findById(lostAndFoundId)).thenReturn(Optional.of(lostAndFound));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> lostAndFoundService.claimLostAndFound(lostAndFoundId, 101L, new LostAndFoundDto.ClaimRequest("mine")));

        assertEquals("You cannot claim your own lost and found post.", exception.getMessage());
    }

    @Test
    void claimLostAndFound_ResolvedPostCannotBeClaimed() {
        lostAndFound.setResolved(true);
        when(lostAndFoundRepository.findById(lostAndFoundId)).thenReturn(Optional.of(lostAndFound));

        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> lostAndFoundService.claimLostAndFound(lostAndFoundId, 202L, new LostAndFoundDto.ClaimRequest("mine")));

        assertEquals("Cannot claim a resolved lost and found post.", exception.getMessage());
    }
}

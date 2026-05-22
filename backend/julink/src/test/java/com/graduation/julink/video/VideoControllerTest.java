package com.graduation.julink.video;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.security.Principal;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VideoControllerTest {

    @Mock
    private VideoService videoService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private Principal principal;

    @InjectMocks
    private VideoController videoController;

    private VideoDTOs.intiate dto;

    @BeforeEach
    void setUp() {
        dto = new VideoDTOs.intiate("targetUser", "callerUser");
    }

    @Test
    void initiate_WithPrincipal_Success() {
        when(principal.getName()).thenReturn("callerUser");
        when(videoService.initiate("callerUser", "targetUser")).thenReturn("https://meet.opensuse.org/room");

        videoController.initiate(principal, dto);

        verify(videoService, times(1)).initiate("callerUser", "targetUser");
    }

    @Test
    void initiate_WithoutPrincipal_Success() {
        when(videoService.initiate("callerUser", "targetUser")).thenReturn("https://meet.opensuse.org/room");

        videoController.initiate(null, dto);

        verify(videoService, times(1)).initiate("callerUser", "targetUser");
    }

    @Test
    void initiatee_Health_Success() {
        videoController.initiatee(dto);

        verify(messagingTemplate, times(1)).convertAndSend("/topic/test", "SIGNAL_TEST_SUCCESS");
    }
}

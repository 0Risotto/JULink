package com.graduation.julink.video;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.follow.FollowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VideoServiceTest {

    @Mock
    private AuthRepository authRepository;

    @Mock
    private FollowRepository followRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private VideoService videoService;

    private User caller;
    private User target;

    @BeforeEach
    void setUp() {
        caller = new User();
        caller.setUsername("callerUser");
        caller.setEmail("caller@ju.edu.jo");

        target = new User();
        target.setUsername("targetUser");
    }

    @Test
    void initiate_Success() {
        when(authRepository.findByUsername("callerUser")).thenReturn(Optional.of(caller));
        when(authRepository.findByUsername("targetUser")).thenReturn(Optional.of(target));

        String jitsiUrl = videoService.initiate("callerUser", "targetUser");

        assertNotNull(jitsiUrl);
        assertTrue(jitsiUrl.startsWith("https://meet.opensuse.org/JuLink-"));
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/video-calls"), (Object) any(Map.class));
    }
}

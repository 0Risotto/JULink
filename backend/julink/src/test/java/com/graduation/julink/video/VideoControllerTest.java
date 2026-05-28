package com.graduation.julink.video;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.video.VideoDTOs.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;

import java.security.Principal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VideoControllerTest {

    @Mock private VideoService videoService;
    @Mock private AuthRepository authRepository;
    @Mock private Principal principal;

    @InjectMocks
    private VideoController videoController;

    private final String email = "caller@ju.edu.jo";
    private final String username = "callerUser";

    @BeforeEach
    void setUp() {
        AuthEntities.User user = new AuthEntities.User();
        user.setEmail(email);
        user.setUsername(username);
        when(principal.getName()).thenReturn(email);
        lenient().when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
    }

    @Test
    void startDirectCall_Success() {
        DirectCallRequest req = new DirectCallRequest();
        CallSessionResponse call = new CallSessionResponse();
        when(videoService.startDirectCall(username, req)).thenReturn(call);

        ResponseEntity<CallSessionResponse> response = videoController.startDirectCall(principal, req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(call, response.getBody());
    }

    @Test
    void startGroupCall_Success() {
        GroupCallRequest req = new GroupCallRequest();
        CallSessionResponse call = new CallSessionResponse();
        when(videoService.startGroupCall(username, req)).thenReturn(call);

        ResponseEntity<CallSessionResponse> response = videoController.startGroupCall(principal, req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(call, response.getBody());
    }

    @Test
    void acceptCall_Success() {
        UUID callId = UUID.randomUUID();
        CallSessionResponse call = new CallSessionResponse();
        when(videoService.acceptCall(callId, username)).thenReturn(call);

        ResponseEntity<CallSessionResponse> response = videoController.acceptCall(principal, callId);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(call, response.getBody());
    }

    @Test
    void declineCall_Success() {
        UUID callId = UUID.randomUUID();
        CallSessionResponse call = new CallSessionResponse();
        when(videoService.declineCall(callId, username)).thenReturn(call);

        ResponseEntity<CallSessionResponse> response = videoController.declineCall(principal, callId);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(call, response.getBody());
    }

    @Test
    void cancelCall_Success() {
        UUID callId = UUID.randomUUID();
        CallSessionResponse call = new CallSessionResponse();
        when(videoService.cancelCall(callId, username)).thenReturn(call);

        ResponseEntity<CallSessionResponse> response = videoController.cancelCall(principal, callId);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(call, response.getBody());
    }

    @Test
    void endCall_Success() {
        UUID callId = UUID.randomUUID();
        CallSessionResponse call = new CallSessionResponse();
        when(videoService.endCall(callId, username)).thenReturn(call);

        ResponseEntity<CallSessionResponse> response = videoController.endCall(principal, callId);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(call, response.getBody());
    }

    @Test
    void getHistory_Success() {
        Page<CallSessionResponse> page = new PageImpl<>(List.of(new CallSessionResponse()));
        when(videoService.getHistory(username, PageRequest.of(0, 20))).thenReturn(page);

        ResponseEntity<Page<CallSessionResponse>> response = videoController.getHistory(principal, 0, 20);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(page, response.getBody());
    }

    @Test
    void getActiveCalls_Success() {
        List<CallSessionResponse> activeCalls = List.of(new CallSessionResponse());
        when(videoService.getActiveCalls(username)).thenReturn(activeCalls);

        ResponseEntity<List<CallSessionResponse>> response = videoController.getActiveCalls(principal);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(activeCalls, response.getBody());
    }

    @Test
    void initiate_WebSocketDelegatesToService() {
        InitiateCallRequest req = new InitiateCallRequest();
        req.setUsername("targetUser");

        videoController.initiate(principal, req);

        verify(videoService).initiate(username, "targetUser");
    }
}

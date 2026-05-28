package com.graduation.julink.video;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.video.VideoDTOs.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/video/calls")
public class VideoController {

    private final VideoService videoService;
    private final AuthRepository authRepository;

    @PostMapping("/direct")
    public ResponseEntity<CallSessionResponse> startDirectCall(
            Principal principal,
            @RequestBody DirectCallRequest req) {
        return ResponseEntity.ok(videoService.startDirectCall(getUsernameFromPrincipal(principal), req));
    }

    @PostMapping("/group")
    public ResponseEntity<CallSessionResponse> startGroupCall(
            Principal principal,
            @RequestBody GroupCallRequest req) {
        return ResponseEntity.ok(videoService.startGroupCall(getUsernameFromPrincipal(principal), req));
    }

    @PostMapping("/{callId}/accept")
    public ResponseEntity<CallSessionResponse> acceptCall(
            Principal principal,
            @PathVariable UUID callId) {
        return ResponseEntity.ok(videoService.acceptCall(callId, getUsernameFromPrincipal(principal)));
    }

    @PostMapping("/{callId}/decline")
    public ResponseEntity<CallSessionResponse> declineCall(
            Principal principal,
            @PathVariable UUID callId) {
        return ResponseEntity.ok(videoService.declineCall(callId, getUsernameFromPrincipal(principal)));
    }

    @PostMapping("/{callId}/cancel")
    public ResponseEntity<CallSessionResponse> cancelCall(
            Principal principal,
            @PathVariable UUID callId) {
        return ResponseEntity.ok(videoService.cancelCall(callId, getUsernameFromPrincipal(principal)));
    }

    @PostMapping("/{callId}/end")
    public ResponseEntity<CallSessionResponse> endCall(
            Principal principal,
            @PathVariable UUID callId) {
        return ResponseEntity.ok(videoService.endCall(callId, getUsernameFromPrincipal(principal)));
    }

    @GetMapping("/history")
    public ResponseEntity<Page<CallSessionResponse>> getHistory(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(videoService.getHistory(getUsernameFromPrincipal(principal), PageRequest.of(page, size)));
    }

    @GetMapping("/active")
    public ResponseEntity<List<CallSessionResponse>> getActiveCalls(Principal principal) {
        return ResponseEntity.ok(videoService.getActiveCalls(getUsernameFromPrincipal(principal)));
    }

    @MessageMapping("/video/initiate")
    public void initiate(Principal principal, InitiateCallRequest req) {
        String caller = principal != null && principal.getName() != null
                ? getUsernameFromPrincipal(principal)
                : req.getCaller();
        videoService.initiate(caller, req.getUsername());
    }

    private String getUsernameFromPrincipal(Principal principal) {
        String identifier = principal.getName();
        AuthEntities.User user = authRepository.findByEmail(identifier)
                .orElseGet(() -> authRepository.findByUsername(identifier)
                        .orElseThrow(() -> new RuntimeException("User not found: " + identifier)));
        return user.getUsername();
    }
}

package com.graduation.julink.chat.controller;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.chat.ChatDTOs.*;
import com.graduation.julink.chat.service.ChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatControllerTest {

    @Mock
    private ChatService chatService;

    @Mock
    private AuthRepository authRepository;

    @Mock
    private Principal principal;

    @Mock
    private MultipartFile multipartFile;

    @InjectMocks
    private ChatController chatController;

    private AuthEntities.User user;
    private String email = "test@ju.edu.jo";
    private String username = "testuser";

    @BeforeEach
    void setUp() {
        user = new AuthEntities.User();
        user.setEmail(email);
        user.setUsername(username);
    }

    private void mockPrincipal() {
        when(principal.getName()).thenReturn(email);
        when(authRepository.findByEmail(email)).thenReturn(Optional.of(user));
    }

    @Test
    void listConversations_Success() {
        mockPrincipal();
        List<ConversationResponse> conversations = Collections.singletonList(new ConversationResponse());
        when(chatService.listConversations(username)).thenReturn(conversations);

        ResponseEntity<List<ConversationResponse>> response = chatController.listConversations(principal);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(conversations, response.getBody());
    }

    @Test
    void createOrGetDM_Success() {
        mockPrincipal();
        CreateDMRequest req = new CreateDMRequest();
        ConversationResponse convResponse = new ConversationResponse();
        when(chatService.getOrCreateDM(username, req)).thenReturn(convResponse);

        ResponseEntity<ConversationResponse> response = chatController.createOrGetDM(principal, req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(convResponse, response.getBody());
    }

    @Test
    void createGroup_Success() {
        mockPrincipal();
        CreateGroupRequest req = new CreateGroupRequest();
        ConversationResponse convResponse = new ConversationResponse();
        when(chatService.createGroup(username, req)).thenReturn(convResponse);

        ResponseEntity<ConversationResponse> response = chatController.createGroup(principal, req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(convResponse, response.getBody());
    }

    @Test
    void addMembers_Success() {
        mockPrincipal();
        AddMembersRequest req = new AddMembersRequest();
        ConversationResponse convResponse = new ConversationResponse();
        when(chatService.addMembersToGroup(1L, username, req)).thenReturn(convResponse);

        ResponseEntity<ConversationResponse> response = chatController.addMembers(principal, 1L, req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(convResponse, response.getBody());
    }

    @Test
    void updateGroup_Success() {
        mockPrincipal();
        UpdateGroupRequest req = new UpdateGroupRequest();
        req.setGroupName("Renamed Group");
        ConversationResponse convResponse = new ConversationResponse();
        when(chatService.updateGroup(1L, username, req)).thenReturn(convResponse);

        ResponseEntity<ConversationResponse> response = chatController.updateGroup(principal, 1L, req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(convResponse, response.getBody());
    }

    @Test
    void removeMember_Success() {
        mockPrincipal();
        ConversationResponse convResponse = new ConversationResponse();
        when(chatService.removeMemberFromGroup(1L, username, "member1")).thenReturn(convResponse);

        ResponseEntity<ConversationResponse> response = chatController.removeMember(principal, 1L, "member1");

        assertEquals(200, response.getStatusCode().value());
        assertEquals(convResponse, response.getBody());
    }

    @Test
    void leaveGroup_Success() {
        mockPrincipal();
        ConversationResponse convResponse = new ConversationResponse();
        when(chatService.leaveGroup(1L, username)).thenReturn(convResponse);

        ResponseEntity<ConversationResponse> response = chatController.leaveGroup(principal, 1L);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(convResponse, response.getBody());
    }

    @Test
    void updateMemberAdmin_Success() {
        mockPrincipal();
        UpdateMemberAdminRequest req = new UpdateMemberAdminRequest();
        req.setAdmin(true);
        ConversationResponse convResponse = new ConversationResponse();
        when(chatService.updateMemberAdmin(1L, username, "member1", req)).thenReturn(convResponse);

        ResponseEntity<ConversationResponse> response = chatController.updateMemberAdmin(principal, 1L, "member1", req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(convResponse, response.getBody());
    }

    @Test
    void startGroupCall_Success() {
        mockPrincipal();
        StartGroupCallRequest req = new StartGroupCallRequest();
        GroupCallResponse callResponse = GroupCallResponse.builder()
                .conversationId(1L)
                .roomName("JuLink-Group-1-test")
                .videoUrl("https://meet.opensuse.org/JuLink-Group-1-test")
                .videoCall(true)
                .invitedUsernames(List.of("member1"))
                .build();
        when(chatService.startGroupCall(1L, username, req)).thenReturn(callResponse);

        ResponseEntity<GroupCallResponse> response = chatController.startGroupCall(principal, 1L, req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(callResponse, response.getBody());
    }

    @Test
    void getMessages_Success() {
        mockPrincipal();
        Pageable pageable = PageRequest.of(0, 30);
        Page<MessageResponse> messages = new PageImpl<>(Collections.emptyList());
        when(chatService.getMessages(1L, username, pageable)).thenReturn(messages);

        ResponseEntity<Page<MessageResponse>> response = chatController.getMessages(principal, 1L, 0, 30);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(messages, response.getBody());
    }

    @Test
    void sendMessage_Success() {
        mockPrincipal();
        SendMessageRequest req = new SendMessageRequest();
        MessageResponse msgResponse = new MessageResponse();
        when(chatService.sendMessage(1L, username, req)).thenReturn(msgResponse);

        ResponseEntity<MessageResponse> response = chatController.sendMessage(principal, 1L, req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(msgResponse, response.getBody());
    }

    @Test
    void sendMediaMessage_Success() throws IOException, InterruptedException {
        mockPrincipal();
        MessageResponse msgResponse = new MessageResponse();
        when(chatService.sendMediaMessage(1L, username, multipartFile)).thenReturn(msgResponse);

        ResponseEntity<MessageResponse> response = chatController.sendMediaMessage(principal, 1L, multipartFile);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(msgResponse, response.getBody());
    }

    @Test
    void sharePost_Success() {
        mockPrincipal();
        UUID postId = UUID.randomUUID();
        SharePostRequest req = new SharePostRequest();
        req.setPostId(postId);
        MessageResponse msgResponse = new MessageResponse();
        msgResponse.setSharedPostId(postId);
        when(chatService.sharePost(1L, username, req)).thenReturn(msgResponse);

        ResponseEntity<MessageResponse> response = chatController.sharePost(principal, 1L, req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(msgResponse, response.getBody());
    }

    @Test
    void editMessage_Success() {
        mockPrincipal();
        EditMessageRequest req = new EditMessageRequest();
        MessageResponse msgResponse = new MessageResponse();
        when(chatService.editMessage(1L, username, req)).thenReturn(msgResponse);

        ResponseEntity<MessageResponse> response = chatController.editMessage(principal, 1L, req);

        assertEquals(200, response.getStatusCode().value());
        assertEquals(msgResponse, response.getBody());
    }

    @Test
    void deleteMessage_Success() {
        mockPrincipal();
        doNothing().when(chatService).deleteMessage(1L, username);

        ResponseEntity<Void> response = chatController.deleteMessage(principal, 1L);

        assertEquals(204, response.getStatusCode().value());
        verify(chatService, times(1)).deleteMessage(1L, username);
    }

    @Test
    void markRead_Success() {
        mockPrincipal();
        WsReadPayload payload = new WsReadPayload();
        payload.setLastReadMessageId(10L);
        doNothing().when(chatService).markRead(1L, 10L, username);

        ResponseEntity<Void> response = chatController.markRead(principal, 1L, payload);

        assertEquals(200, response.getStatusCode().value());
        verify(chatService, times(1)).markRead(1L, 10L, username);
    }
}

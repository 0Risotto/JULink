package com.graduation.julink.chat.service;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.chat.ChatDTOs.*;
import com.graduation.julink.chat.ChatEntities.*;
import com.graduation.julink.chat.ChatMapper;
import com.graduation.julink.chat.repo.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock private ConversationRepository conversationRepo;
    @Mock private MessageRepository messageRepo;
    @Mock private ConversationMemberRepository memberRepo;
    @Mock private MessageReadReceiptRepository receiptRepo;
    @Mock private AuthRepository userRepo;
    @Mock private FriendshipValidator friendshipValidator;
    @Mock private FileStorageService fileStorageService;
    @Mock private ChatMapper mapper;
    @Mock private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ChatService chatService;

    private User user1;
    private User user2;
    private Conversation conversation;
    private ConversationMember member1;
    private ConversationMember member2;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setId(101L);
        user1.setUsername("user1");

        user2 = new User();
        user2.setId(102L);
        user2.setUsername("user2");

        conversation = new Conversation();
        conversation.setId(1L);
        conversation.setGroup(false);

        member1 = new ConversationMember();
        member1.setUser(user1);
        member1.setConversation(conversation);
        member1.setAdmin(true);

        member2 = new ConversationMember();
        member2.setUser(user2);
        member2.setConversation(conversation);
        member2.setAdmin(false);

        conversation.setMembers(new java.util.HashSet<>(List.of(member1, member2)));
    }

    @Test
    void getOrCreateDM_ExistingDM() {
        CreateDMRequest req = new CreateDMRequest();
        req.setTargetUsername("user2");

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(userRepo.findByUsername("user2")).thenReturn(Optional.of(user2));
        doNothing().when(friendshipValidator).assertFriends("user1", "user2");
        when(conversationRepo.findDMBetween(101L, 102L)).thenReturn(Optional.of(conversation));
        
        ConversationResponse convResp = new ConversationResponse();
        when(mapper.toConversationResponse(any(), any(), anyInt())).thenReturn(convResp);

        ConversationResponse response = chatService.getOrCreateDM("user1", req);

        assertNotNull(response);
        verify(conversationRepo, times(0)).save(any(Conversation.class));
    }

    @Test
    void getOrCreateDM_NewDM() {
        CreateDMRequest req = new CreateDMRequest();
        req.setTargetUsername("user2");

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(userRepo.findByUsername("user2")).thenReturn(Optional.of(user2));
        doNothing().when(friendshipValidator).assertFriends("user1", "user2");
        when(conversationRepo.findDMBetween(101L, 102L)).thenReturn(Optional.empty());
        
        ConversationResponse convResp = new ConversationResponse();
        when(mapper.toConversationResponse(any(), any(), anyInt())).thenReturn(convResp);

        ConversationResponse response = chatService.getOrCreateDM("user1", req);

        assertNotNull(response);
        verify(conversationRepo, times(1)).save(any(Conversation.class));
    }

    @Test
    void createGroup_Success() {
        CreateGroupRequest req = new CreateGroupRequest();
        req.setGroupName("Test Group");
        req.setMemberUsernames(List.of("user2"));

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(userRepo.findByUsername("user2")).thenReturn(Optional.of(user2));
        doNothing().when(friendshipValidator).assertFriends("user1", "user2");

        ConversationResponse convResp = new ConversationResponse();
        when(mapper.toConversationResponse(any(), any(), anyInt())).thenReturn(convResp);

        ConversationResponse response = chatService.createGroup("user1", req);

        assertNotNull(response);
        verify(conversationRepo, times(1)).save(any(Conversation.class));
    }

    @Test
    void sendMessage_Success() {
        SendMessageRequest req = new SendMessageRequest();
        req.setContent("Hello");
        req.setMessageType(MessageType.TEXT);

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));
        doNothing().when(friendshipValidator).assertFriends("user1", "user2");

        MessageResponse msgResp = new MessageResponse();
        when(mapper.toMessageResponse(any())).thenReturn(msgResp);

        MessageResponse response = chatService.sendMessage(1L, "user1", req);

        assertNotNull(response);
        verify(messageRepo, times(1)).save(any(Message.class));
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/conversations/1"), any(WsMessageEvent.class));
    }

    @Test
    void getMessages_Success() {
        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));

        Message msg = new Message();
        Page<Message> page = new PageImpl<>(List.of(msg));
        when(messageRepo.findByConversationId(eq(1L), any(Pageable.class))).thenReturn(page);

        MessageResponse msgResp = new MessageResponse();
        when(mapper.toMessageResponse(msg)).thenReturn(msgResp);

        Page<MessageResponse> result = chatService.getMessages(1L, "user1", Pageable.unpaged());

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void markRead_Success() {
        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));

        Message msg = new Message();
        when(messageRepo.findById(10L)).thenReturn(Optional.of(msg));

        when(receiptRepo.existsByMessageIdAndUserId(10L, 101L)).thenReturn(false);

        chatService.markRead(1L, 10L, "user1");

        verify(receiptRepo, times(1)).save(any(MessageReadReceipt.class));
        verify(messageRepo, times(1)).markAsRead(1L, 101L, 10L);
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/conversations/1/read"), any(WsReadEvent.class));
    }
}

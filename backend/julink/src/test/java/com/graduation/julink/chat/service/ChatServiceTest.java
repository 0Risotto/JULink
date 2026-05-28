package com.graduation.julink.chat.service;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.chat.ChatDTOs.*;
import com.graduation.julink.chat.ChatEntities.*;
import com.graduation.julink.chat.ChatMapper;
import com.graduation.julink.chat.repo.*;
import com.graduation.julink.notification.NotificationService;
import com.graduation.julink.post.PostEntities.Post;
import com.graduation.julink.post.PostRepository;
import com.graduation.julink.video.VideoDTOs;
import com.graduation.julink.video.VideoEntities;
import com.graduation.julink.video.VideoService;
import jakarta.persistence.EntityNotFoundException;
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
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.nullable;
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
    @Mock private PostRepository postRepository;
    @Mock private NotificationService notificationService;
    @Mock private VideoService videoService;

    @InjectMocks
    private ChatService chatService;

    private User user1;
    private User user2;
    private User user3;
    private Conversation conversation;
    private ConversationMember member1;
    private ConversationMember member2;
    private ConversationMember member3;

    @BeforeEach
    void setUp() {
        user1 = new User();
        user1.setId(101L);
        user1.setUsername("user1");

        user2 = new User();
        user2.setId(102L);
        user2.setUsername("user2");

        user3 = new User();
        user3.setId(103L);
        user3.setUsername("user3");

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

        member3 = new ConversationMember();
        member3.setUser(user3);
        member3.setConversation(conversation);
        member3.setAdmin(false);

        conversation.setMembers(new java.util.HashSet<>(List.of(member1, member2)));

        lenient().when(messageRepo.findLatestByConversationId(nullable(Long.class))).thenReturn(Optional.empty());
        lenient().when(messageRepo.countUnread(nullable(Long.class), nullable(Long.class))).thenReturn(0);
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
        when(mapper.toConversationResponse(any(Conversation.class), nullable(Message.class), anyInt())).thenReturn(convResp);

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
        when(mapper.toConversationResponse(any(Conversation.class), nullable(Message.class), anyInt())).thenReturn(convResp);

        ConversationResponse response = chatService.getOrCreateDM("user1", req);

        assertNotNull(response);
        verify(conversationRepo, times(1)).save(any(Conversation.class));
    }

    @Test
    void createGroup_CreatorIsAdmin() {
        CreateGroupRequest req = new CreateGroupRequest();
        req.setGroupName("Test Group");
        req.setMemberUsernames(List.of("user2"));

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(userRepo.findByUsername("user2")).thenReturn(Optional.of(user2));
        doNothing().when(friendshipValidator).assertFriends("user1", "user2");
        when(mapper.toConversationResponse(any(Conversation.class), nullable(Message.class), anyInt()))
                .thenReturn(new ConversationResponse());

        chatService.createGroup("user1", req);

        verify(conversationRepo).save(argThat(savedGroup ->
                savedGroup.isGroup()
                        && savedGroup.getMembers().stream()
                        .anyMatch(member -> member.getUser().getId().equals(101L) && member.isAdmin())
        ));
    }

    @Test
    void updateGroup_AdminCanRenameAndChangeImage() {
        makeGroup();
        UpdateGroupRequest req = new UpdateGroupRequest();
        req.setGroupName("Renamed Group");
        req.setGroupPictureUrl("https://example.com/group.png");
        ConversationResponse convResp = new ConversationResponse();

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));
        when(conversationRepo.save(conversation)).thenReturn(conversation);
        when(mapper.toConversationResponse(conversation, null, 0)).thenReturn(convResp);

        ConversationResponse response = chatService.updateGroup(1L, "user1", req);

        assertEquals(convResp, response);
        assertEquals("Renamed Group", conversation.getGroupName());
        assertEquals("https://example.com/group.png", conversation.getGroupPictureUrl());
    }

    @Test
    void updateGroup_NonAdminRejected() {
        makeGroup();
        UpdateGroupRequest req = new UpdateGroupRequest();
        req.setGroupName("Renamed Group");

        when(userRepo.findByUsername("user2")).thenReturn(Optional.of(user2));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));

        assertThrows(SecurityException.class, () -> chatService.updateGroup(1L, "user2", req));
        verify(conversationRepo, never()).save(any());
    }

    @Test
    void removeMember_AdminCanRemoveMember() {
        makeGroupWithThreeMembers();
        ConversationResponse convResp = new ConversationResponse();

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(userRepo.findByUsername("user2")).thenReturn(Optional.of(user2));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));
        when(conversationRepo.save(conversation)).thenReturn(conversation);
        when(mapper.toConversationResponse(conversation, null, 0)).thenReturn(convResp);

        ConversationResponse response = chatService.removeMemberFromGroup(1L, "user1", "user2");

        assertEquals(convResp, response);
        assertFalse(conversation.getMembers().contains(member2));
        verify(memberRepo).delete(member2);
    }

    @Test
    void removeMember_AdminCannotRemoveSelf() {
        makeGroup();

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));

        assertThrows(IllegalArgumentException.class,
                () -> chatService.removeMemberFromGroup(1L, "user1", "user1"));
        verify(memberRepo, never()).delete(any());
        verify(conversationRepo, never()).save(any());
    }

    @Test
    void leaveGroup_LastAdminRejected() {
        makeGroup();

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));

        assertThrows(IllegalStateException.class, () -> chatService.leaveGroup(1L, "user1"));
        verify(memberRepo, never()).delete(any());
    }

    @Test
    void leaveGroup_NonAdminCanLeave() {
        makeGroup();
        ConversationResponse convResp = new ConversationResponse();

        when(userRepo.findByUsername("user2")).thenReturn(Optional.of(user2));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));
        when(conversationRepo.save(conversation)).thenReturn(conversation);
        when(mapper.toConversationResponse(conversation, null, 0)).thenReturn(convResp);

        ConversationResponse response = chatService.leaveGroup(1L, "user2");

        assertEquals(convResp, response);
        assertFalse(conversation.getMembers().contains(member2));
        verify(memberRepo).delete(member2);
    }

    @Test
    void updateMemberAdmin_AdminCanPromoteMember() {
        makeGroup();
        UpdateMemberAdminRequest req = new UpdateMemberAdminRequest();
        req.setAdmin(true);
        ConversationResponse convResp = new ConversationResponse();

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(userRepo.findByUsername("user2")).thenReturn(Optional.of(user2));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));
        when(conversationRepo.save(conversation)).thenReturn(conversation);
        when(mapper.toConversationResponse(conversation, null, 0)).thenReturn(convResp);

        ConversationResponse response = chatService.updateMemberAdmin(1L, "user1", "user2", req);

        assertEquals(convResp, response);
        assertTrue(member2.isAdmin());
        verify(memberRepo).save(member2);
    }

    @Test
    void updateMemberAdmin_LastAdminCannotBeDemoted() {
        makeGroup();
        UpdateMemberAdminRequest req = new UpdateMemberAdminRequest();
        req.setAdmin(false);

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));

        assertThrows(IllegalStateException.class, () -> chatService.updateMemberAdmin(1L, "user1", "user1", req));
        verify(memberRepo, never()).save(any());
    }

    @Test
    void startGroupCall_BroadcastsToAllMembersExceptCaller() {
        makeGroupWithThreeMembers();
        StartGroupCallRequest req = new StartGroupCallRequest();
        req.setVideoCall(true);
        VideoDTOs.CallSessionResponse call = VideoDTOs.CallSessionResponse.builder()
                .roomName("JuLink-GROUP-test")
                .videoUrl("https://meet.opensuse.org/JuLink-GROUP-test")
                .callType(VideoEntities.CallType.VIDEO)
                .participants(List.of(
                        VideoDTOs.CallParticipantResponse.builder()
                                .username("user2")
                                .role(VideoEntities.ParticipantRole.INVITEE)
                                .build(),
                        VideoDTOs.CallParticipantResponse.builder()
                                .username("user3")
                                .role(VideoEntities.ParticipantRole.INVITEE)
                                .build()
                ))
                .build();
        when(videoService.startGroupCall(eq("user1"), any(VideoDTOs.GroupCallRequest.class))).thenReturn(call);

        GroupCallResponse response = chatService.startGroupCall(1L, "user1", req);

        assertEquals(1L, response.getConversationId());
        assertEquals("JuLink-GROUP-test", response.getRoomName());
        assertEquals("https://meet.opensuse.org/JuLink-GROUP-test", response.getVideoUrl());
        assertEquals(List.of("user2", "user3"), response.getInvitedUsernames().stream().sorted().toList());
        verify(videoService).startGroupCall(eq("user1"), argThat(request ->
                request.getConversationId().equals(1L) && request.getCallType() == VideoEntities.CallType.VIDEO));
    }

    @Test
    void groupOnlyOperation_RejectsDm() {
        UpdateGroupRequest req = new UpdateGroupRequest();
        req.setGroupName("Nope");

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));

        assertThrows(IllegalStateException.class, () -> chatService.updateGroup(1L, "user1", req));
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
        when(mapper.toConversationResponse(any(Conversation.class), nullable(Message.class), anyInt())).thenReturn(convResp);

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
    void sharePost_Success() {
        UUID postId = UUID.randomUUID();
        SharePostRequest req = new SharePostRequest();
        req.setPostId(postId);
        Post post = new Post();
        post.setPostId(postId);

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        doNothing().when(friendshipValidator).assertFriends("user1", "user2");

        MessageResponse msgResp = new MessageResponse();
        msgResp.setMessageType(MessageType.POST_SHARE);
        msgResp.setSharedPostId(postId);
        when(mapper.toMessageResponse(any())).thenReturn(msgResp);

        MessageResponse response = chatService.sharePost(1L, "user1", req);

        assertNotNull(response);
        assertEquals(MessageType.POST_SHARE, response.getMessageType());
        assertEquals(postId, response.getSharedPostId());
        verify(messageRepo).save(argThat(message ->
                message.getMessageType() == MessageType.POST_SHARE
                        && postId.equals(message.getSharedPostId())
                        && message.getContent() == null
        ));
        verify(messagingTemplate).convertAndSend(eq("/topic/conversations/1"), any(WsMessageEvent.class));
    }

    @Test
    void sharePost_PostNotFound_DoesNotPersistOrBroadcast() {
        UUID postId = UUID.randomUUID();
        SharePostRequest req = new SharePostRequest();
        req.setPostId(postId);

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));
        doNothing().when(friendshipValidator).assertFriends("user1", "user2");
        when(postRepository.findById(postId)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> chatService.sharePost(1L, "user1", req));
        verify(messageRepo, never()).save(any(Message.class));
        verify(conversationRepo, never()).save(any(Conversation.class));
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/conversations/1"), any(WsMessageEvent.class));
    }

    @Test
    void sharePost_NonMember_DoesNotLookupPostOrPersist() {
        UUID postId = UUID.randomUUID();
        SharePostRequest req = new SharePostRequest();
        req.setPostId(postId);

        when(userRepo.findByUsername("user3")).thenReturn(Optional.of(user3));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));

        assertThrows(SecurityException.class, () -> chatService.sharePost(1L, "user3", req));
        verify(postRepository, never()).findById(any());
        verify(messageRepo, never()).save(any(Message.class));
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/conversations/1"), any(WsMessageEvent.class));
    }

    @Test
    void sharePost_FriendshipRejected_DoesNotLookupPostOrPersist() {
        UUID postId = UUID.randomUUID();
        SharePostRequest req = new SharePostRequest();
        req.setPostId(postId);

        when(userRepo.findByUsername("user1")).thenReturn(Optional.of(user1));
        when(conversationRepo.findById(1L)).thenReturn(Optional.of(conversation));
        doThrow(new SecurityException("Not friends"))
                .when(friendshipValidator).assertFriends("user1", "user2");

        assertThrows(SecurityException.class, () -> chatService.sharePost(1L, "user1", req));
        verify(postRepository, never()).findById(any());
        verify(messageRepo, never()).save(any(Message.class));
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/conversations/1"), any(WsMessageEvent.class));
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

    private void makeGroup() {
        conversation.setGroup(true);
        conversation.setGroupName("Test Group");
        conversation.setMembers(new java.util.HashSet<>(List.of(member1, member2)));
    }

    private void makeGroupWithThreeMembers() {
        conversation.setGroup(true);
        conversation.setGroupName("Test Group");
        conversation.setMembers(new java.util.HashSet<>(List.of(member1, member2, member3)));
    }
}

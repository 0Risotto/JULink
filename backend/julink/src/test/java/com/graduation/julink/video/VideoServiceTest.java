package com.graduation.julink.video;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.chat.ChatEntities.Conversation;
import com.graduation.julink.chat.ChatEntities.ConversationMember;
import com.graduation.julink.chat.repo.ConversationRepository;
import com.graduation.julink.follow.FollowRepository;
import com.graduation.julink.notification.NotificationService;
import com.graduation.julink.notification.NotificationType;
import com.graduation.julink.video.VideoDTOs.CallSessionResponse;
import com.graduation.julink.video.VideoDTOs.DirectCallRequest;
import com.graduation.julink.video.VideoDTOs.GroupCallRequest;
import com.graduation.julink.video.VideoEntities.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VideoServiceTest {

    @Mock private AuthRepository authRepository;
    @Mock private FollowRepository followRepository;
    @Mock private ConversationRepository conversationRepository;
    @Mock private VideoRepository videoRepository;
    @Mock private SimpMessagingTemplate messagingTemplate;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private VideoService videoService;

    private User caller;
    private User target;
    private User thirdUser;

    @BeforeEach
    void setUp() {
        caller = user(101L, "callerUser", "caller@ju.edu.jo");
        target = user(102L, "targetUser", "target@ju.edu.jo");
        thirdUser = user(103L, "thirdUser", "third@ju.edu.jo");

        lenient().when(videoRepository.save(any(CallSession.class))).thenAnswer(invocation -> {
            CallSession session = invocation.getArgument(0);
            if (session.getId() == null) {
                session.setId(UUID.randomUUID());
            }
            return session;
        });
    }

    @Test
    void startDirectCall_CreatesSessionAndSendsInviteToTargetQueue() {
        DirectCallRequest req = new DirectCallRequest();
        req.setTargetUsername("targetUser");
        req.setCallType(CallType.VIDEO);

        when(authRepository.findByUsername("callerUser")).thenReturn(Optional.of(caller));
        when(authRepository.findByUsername("targetUser")).thenReturn(Optional.of(target));
        when(followRepository.isMutual("callerUser", "targetUser")).thenReturn(true);

        CallSessionResponse response = videoService.startDirectCall("callerUser", req);

        assertNotNull(response.getId());
        assertEquals(CallScope.DIRECT, response.getScope());
        assertEquals(CallStatus.RINGING, response.getStatus());
        assertTrue(response.getVideoUrl().startsWith("https://meet.opensuse.org/JuLink-DIRECT-"));
        assertEquals(2, response.getParticipants().size());
        verify(messagingTemplate).convertAndSend(eq("/queue/video-calls/targetUser"), any(Object.class));
        verify(messagingTemplate, never()).convertAndSend(eq("/topic/video-calls"), any(Object.class));
    }

    @Test
    void startDirectCall_SelfCallRejected() {
        DirectCallRequest req = new DirectCallRequest();
        req.setTargetUsername("callerUser");

        when(authRepository.findByUsername("callerUser")).thenReturn(Optional.of(caller));

        assertThrows(IllegalArgumentException.class, () -> videoService.startDirectCall("callerUser", req));
        verify(videoRepository, never()).save(any());
    }

    @Test
    void startDirectCall_NonFriendRejected() {
        DirectCallRequest req = new DirectCallRequest();
        req.setTargetUsername("targetUser");

        when(authRepository.findByUsername("callerUser")).thenReturn(Optional.of(caller));
        when(authRepository.findByUsername("targetUser")).thenReturn(Optional.of(target));
        when(followRepository.isMutual("callerUser", "targetUser")).thenReturn(false);

        assertThrows(SecurityException.class, () -> videoService.startDirectCall("callerUser", req));
        verify(videoRepository, never()).save(any());
    }

    @Test
    void startGroupCall_InvitesMembersExceptCaller() {
        GroupCallRequest req = new GroupCallRequest();
        req.setConversationId(1L);
        req.setCallType(CallType.AUDIO);
        Conversation conversation = groupConversation();

        when(authRepository.findByUsername("callerUser")).thenReturn(Optional.of(caller));
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));

        CallSessionResponse response = videoService.startGroupCall("callerUser", req);

        assertEquals(CallScope.GROUP, response.getScope());
        assertEquals(CallType.AUDIO, response.getCallType());
        assertEquals(3, response.getParticipants().size());
        verify(messagingTemplate).convertAndSend(eq("/queue/video-calls/targetUser"), any(Object.class));
        verify(messagingTemplate).convertAndSend(eq("/queue/video-calls/thirdUser"), any(Object.class));
        verify(messagingTemplate, never()).convertAndSend(eq("/queue/video-calls/callerUser"), any(Object.class));
    }

    @Test
    void startGroupCall_NonMemberRejected() {
        GroupCallRequest req = new GroupCallRequest();
        req.setConversationId(1L);
        Conversation conversation = groupConversation();
        conversation.getMembers().removeIf(member -> member.getUser().getId().equals(caller.getId()));

        when(authRepository.findByUsername("callerUser")).thenReturn(Optional.of(caller));
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(conversation));

        assertThrows(SecurityException.class, () -> videoService.startGroupCall("callerUser", req));
    }

    @Test
    void acceptCall_MarksParticipantAndSessionAccepted() {
        CallSession session = directSession();
        UUID callId = session.getId();

        when(authRepository.findByUsername("targetUser")).thenReturn(Optional.of(target));
        when(videoRepository.findWithParticipantsById(callId)).thenReturn(Optional.of(session));

        CallSessionResponse response = videoService.acceptCall(callId, "targetUser");

        assertEquals(CallStatus.ACCEPTED, response.getStatus());
        assertTrue(response.getParticipants().stream()
                .anyMatch(participant -> "targetUser".equals(participant.getUsername())
                        && participant.getStatus() == ParticipantStatus.ACCEPTED));
        verify(messagingTemplate, times(2)).convertAndSend(startsWith("/queue/video-calls/"), any(Object.class));
    }

    @Test
    void declineCall_AllInviteesDeclinedMarksSessionDeclined() {
        CallSession session = directSession();
        UUID callId = session.getId();

        when(authRepository.findByUsername("targetUser")).thenReturn(Optional.of(target));
        when(videoRepository.findWithParticipantsById(callId)).thenReturn(Optional.of(session));

        CallSessionResponse response = videoService.declineCall(callId, "targetUser");

        assertEquals(CallStatus.DECLINED, response.getStatus());
        assertNotNull(response.getEndedAt());
    }

    @Test
    void cancelCall_OnlyCallerCanCancelRingingCall() {
        CallSession session = directSession();
        UUID callId = session.getId();

        when(authRepository.findByUsername("callerUser")).thenReturn(Optional.of(caller));
        when(videoRepository.findWithParticipantsById(callId)).thenReturn(Optional.of(session));

        CallSessionResponse response = videoService.cancelCall(callId, "callerUser");

        assertEquals(CallStatus.CANCELLED, response.getStatus());
        verify(messagingTemplate, times(2)).convertAndSend(startsWith("/queue/video-calls/"), any(Object.class));
    }

    @Test
    void endCall_ParticipantEndsActiveCall() {
        CallSession session = directSession();
        session.setStatus(CallStatus.ACCEPTED);
        UUID callId = session.getId();

        when(authRepository.findByUsername("targetUser")).thenReturn(Optional.of(target));
        when(videoRepository.findWithParticipantsById(callId)).thenReturn(Optional.of(session));

        CallSessionResponse response = videoService.endCall(callId, "targetUser");

        assertEquals(CallStatus.ENDED, response.getStatus());
    }

    @Test
    void expireRingingCalls_MarksMissedAndNotifiesInvitee() {
        CallSession session = directSession();
        session.setExpiresAt(LocalDateTime.now().minusSeconds(1));
        when(videoRepository.findByStatusAndExpiresAtBefore(eq(CallStatus.RINGING), any(LocalDateTime.class)))
                .thenReturn(java.util.List.of(session));

        videoService.expireRingingCalls(LocalDateTime.now());

        assertEquals(CallStatus.MISSED, session.getStatus());
        verify(notificationService).notifyUser(
                eq(target),
                eq(caller),
                eq(NotificationType.MISSED_CALL),
                contains("callerUser"),
                eq("CALL"),
                eq(session.getId().toString()),
                anyString()
        );
    }

    private CallSession directSession() {
        CallSession session = new CallSession();
        session.setId(UUID.randomUUID());
        session.setCaller(caller);
        session.setCallType(CallType.VIDEO);
        session.setScope(CallScope.DIRECT);
        session.setStatus(CallStatus.RINGING);
        session.setRoomName("JuLink-DIRECT-test");
        session.setVideoUrl("https://meet.opensuse.org/JuLink-DIRECT-test");
        session.setExpiresAt(LocalDateTime.now().plusSeconds(60));
        session.setParticipants(new HashSet<>());
        session.getParticipants().add(participant(session, caller, ParticipantRole.CALLER, ParticipantStatus.ACCEPTED));
        session.getParticipants().add(participant(session, target, ParticipantRole.INVITEE, ParticipantStatus.INVITED));
        return session;
    }

    private Conversation groupConversation() {
        Conversation conversation = new Conversation();
        conversation.setId(1L);
        conversation.setGroup(true);
        conversation.setGroupName("Group");
        conversation.setMembers(new HashSet<>());
        conversation.getMembers().add(conversationMember(conversation, caller));
        conversation.getMembers().add(conversationMember(conversation, target));
        conversation.getMembers().add(conversationMember(conversation, thirdUser));
        return conversation;
    }

    private ConversationMember conversationMember(Conversation conversation, User user) {
        ConversationMember member = new ConversationMember();
        member.setConversation(conversation);
        member.setUser(user);
        return member;
    }

    private CallParticipant participant(CallSession session, User user, ParticipantRole role, ParticipantStatus status) {
        CallParticipant participant = new CallParticipant();
        participant.setSession(session);
        participant.setUser(user);
        participant.setRole(role);
        participant.setStatus(status);
        return participant;
    }

    private User user(Long id, String username, String email) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        return user;
    }
}

package com.graduation.julink.video;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.chat.ChatEntities.Conversation;
import com.graduation.julink.chat.ChatEntities.ConversationMember;
import com.graduation.julink.chat.repo.ConversationRepository;
import com.graduation.julink.follow.FollowRepository;
import com.graduation.julink.notification.NotificationService;
import com.graduation.julink.notification.NotificationType;
import com.graduation.julink.video.VideoDTOs.*;
import com.graduation.julink.video.VideoEntities.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class VideoService {
    private static final int RING_TIMEOUT_SECONDS = 60;
    private static final String JITSI_BASE_URL = "https://meet.opensuse.org/";

    private final AuthRepository authRepository;
    private final FollowRepository followRepository;
    private final ConversationRepository conversationRepository;
    private final VideoRepository videoRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;

    public CallSessionResponse startDirectCall(String callerIdentifier, DirectCallRequest req) {
        User caller = loadUser(callerIdentifier);
        User target = loadUserByUsername(req.getTargetUsername());
        if (caller.getId().equals(target.getId())) {
            throw new IllegalArgumentException("You cannot call yourself");
        }
        if (!followRepository.isMutual(caller.getUsername(), target.getUsername())) {
            throw new SecurityException("Users must be mutual friends to start a call");
        }

        CallSession session = newSession(caller, normalizeCallType(req.getCallType()), CallScope.DIRECT, null);
        addParticipant(session, caller, ParticipantRole.CALLER, ParticipantStatus.ACCEPTED);
        addParticipant(session, target, ParticipantRole.INVITEE, ParticipantStatus.INVITED);

        CallSession saved = videoRepository.save(session);
        sendEventToParticipants(saved, "CALL_INVITED");
        return toResponse(saved);
    }

    public CallSessionResponse startGroupCall(String callerIdentifier, GroupCallRequest req) {
        User caller = loadUser(callerIdentifier);
        Conversation conversation = conversationRepository.findById(req.getConversationId())
                .orElseThrow(() -> new EntityNotFoundException("Conversation not found: " + req.getConversationId()));
        if (!conversation.isGroup()) {
            throw new IllegalStateException("Not a group conversation");
        }
        ConversationMember callerMember = findMember(conversation, caller);

        CallSession session = newSession(caller, normalizeCallType(req.getCallType()), CallScope.GROUP, conversation);
        addParticipant(session, callerMember.getUser(), ParticipantRole.CALLER, ParticipantStatus.ACCEPTED);
        conversation.getMembers().stream()
                .map(ConversationMember::getUser)
                .filter(user -> !user.getId().equals(caller.getId()))
                .forEach(user -> addParticipant(session, user, ParticipantRole.INVITEE, ParticipantStatus.INVITED));

        CallSession saved = videoRepository.save(session);
        sendEventToParticipants(saved, "CALL_INVITED");
        return toResponse(saved);
    }

    /**
     * Deprecated compatibility entry for the existing websocket command.
     */
    public String initiate(String callerIdentifier, String friendUsername) {
        DirectCallRequest req = new DirectCallRequest();
        req.setTargetUsername(friendUsername);
        req.setCallType(CallType.VIDEO);
        return startDirectCall(callerIdentifier, req).getVideoUrl();
    }

    public CallSessionResponse acceptCall(UUID callId, String username) {
        User user = loadUser(username);
        CallSession session = loadSession(callId);
        assertActiveRingingOrAccepted(session);
        CallParticipant participant = findParticipant(session, user);
        if (participant.getRole() == ParticipantRole.CALLER) {
            return toResponse(session);
        }
        participant.setStatus(ParticipantStatus.ACCEPTED);
        participant.setRespondedAt(LocalDateTime.now());
        if (session.getStatus() == CallStatus.RINGING) {
            session.setStatus(CallStatus.ACCEPTED);
            session.setAcceptedAt(LocalDateTime.now());
        }
        CallSession saved = videoRepository.save(session);
        sendEventToParticipants(saved, "CALL_ACCEPTED");
        return toResponse(saved);
    }

    public CallSessionResponse declineCall(UUID callId, String username) {
        User user = loadUser(username);
        CallSession session = loadSession(callId);
        if (session.getStatus() != CallStatus.RINGING) {
            throw new IllegalStateException("Only ringing calls can be declined");
        }
        CallParticipant participant = findParticipant(session, user);
        if (participant.getRole() == ParticipantRole.CALLER) {
            throw new IllegalArgumentException("Caller should cancel the call");
        }
        participant.setStatus(ParticipantStatus.DECLINED);
        participant.setRespondedAt(LocalDateTime.now());
        if (remainingInvitedCount(session) == 0) {
            session.setStatus(CallStatus.DECLINED);
            session.setEndedAt(LocalDateTime.now());
        }
        CallSession saved = videoRepository.save(session);
        sendEventToParticipants(saved, "CALL_DECLINED");
        return toResponse(saved);
    }

    public CallSessionResponse cancelCall(UUID callId, String username) {
        User caller = loadUser(username);
        CallSession session = loadSession(callId);
        if (!session.getCaller().getId().equals(caller.getId())) {
            throw new SecurityException("Only the caller can cancel this call");
        }
        if (session.getStatus() != CallStatus.RINGING) {
            throw new IllegalStateException("Only ringing calls can be cancelled");
        }
        session.setStatus(CallStatus.CANCELLED);
        session.setEndedAt(LocalDateTime.now());
        markInvitees(session, ParticipantStatus.MISSED);
        CallSession saved = videoRepository.save(session);
        sendEventToParticipants(saved, "CALL_CANCELLED");
        return toResponse(saved);
    }

    public CallSessionResponse endCall(UUID callId, String username) {
        User user = loadUser(username);
        CallSession session = loadSession(callId);
        findParticipant(session, user);
        if (session.getStatus() != CallStatus.RINGING && session.getStatus() != CallStatus.ACCEPTED) {
            return toResponse(session);
        }
        session.setStatus(CallStatus.ENDED);
        session.setEndedAt(LocalDateTime.now());
        session.getParticipants().forEach(participant -> {
            if (participant.getStatus() == ParticipantStatus.ACCEPTED || participant.getStatus() == ParticipantStatus.INVITED) {
                participant.setStatus(ParticipantStatus.LEFT);
                participant.setLeftAt(LocalDateTime.now());
            }
        });
        CallSession saved = videoRepository.save(session);
        sendEventToParticipants(saved, "CALL_ENDED");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<CallSessionResponse> getHistory(String username, Pageable pageable) {
        User user = loadUser(username);
        return videoRepository.findHistoryForUser(user.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<CallSessionResponse> getActiveCalls(String username) {
        User user = loadUser(username);
        return videoRepository.findActiveForUser(user.getId(), List.of(CallStatus.RINGING, CallStatus.ACCEPTED))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Scheduled(fixedRate = 15000)
    public void expireRingingCalls() {
        expireRingingCalls(LocalDateTime.now());
    }

    public void expireRingingCalls(LocalDateTime now) {
        List<CallSession> expired = videoRepository.findByStatusAndExpiresAtBefore(CallStatus.RINGING, now);
        for (CallSession session : expired) {
            session.setStatus(CallStatus.MISSED);
            session.setEndedAt(now);
            markInvitees(session, ParticipantStatus.MISSED);
            CallSession saved = videoRepository.save(session);
            sendEventToParticipants(saved, "CALL_MISSED");
            notifyMissedCall(saved);
        }
    }

    private CallSession newSession(User caller, CallType callType, CallScope scope, Conversation conversation) {
        CallSession session = new CallSession();
        session.setCaller(caller);
        session.setCallType(callType);
        session.setScope(scope);
        session.setConversation(conversation);
        session.setExpiresAt(LocalDateTime.now().plusSeconds(RING_TIMEOUT_SECONDS));
        String roomName = "JuLink-" + scope.name() + "-" + UUID.randomUUID().toString().substring(0, 8);
        session.setRoomName(roomName);
        session.setVideoUrl(JITSI_BASE_URL + roomName);
        return session;
    }

    private void addParticipant(CallSession session, User user, ParticipantRole role, ParticipantStatus status) {
        CallParticipant participant = new CallParticipant();
        participant.setSession(session);
        participant.setUser(user);
        participant.setRole(role);
        participant.setStatus(status);
        if (status == ParticipantStatus.ACCEPTED) {
            participant.setRespondedAt(LocalDateTime.now());
        }
        session.getParticipants().add(participant);
    }

    private void sendEventToParticipants(CallSession session, String type) {
        session.getParticipants().forEach(participant -> sendEvent(session, participant.getUser(), type));
    }

    private void sendEvent(CallSession session, User recipient, String type) {
        CallEvent event = toEvent(session, recipient, type);
        messagingTemplate.convertAndSend("/queue/video-calls/" + recipient.getUsername(), event);
    }

    private void notifyMissedCall(CallSession session) {
        session.getParticipants().stream()
                .filter(participant -> participant.getRole() == ParticipantRole.INVITEE)
                .filter(participant -> participant.getStatus() == ParticipantStatus.MISSED)
                .forEach(participant -> notificationService.notifyUser(
                        participant.getUser(),
                        session.getCaller(),
                        NotificationType.MISSED_CALL,
                        "Missed call from " + session.getCaller().getUsername(),
                        "CALL",
                        session.getId().toString(),
                        "{\"callId\":\"" + session.getId() + "\"}"
                ));
    }

    private long remainingInvitedCount(CallSession session) {
        return session.getParticipants().stream()
                .filter(participant -> participant.getRole() == ParticipantRole.INVITEE)
                .filter(participant -> participant.getStatus() == ParticipantStatus.INVITED)
                .count();
    }

    private void markInvitees(CallSession session, ParticipantStatus status) {
        session.getParticipants().stream()
                .filter(participant -> participant.getRole() == ParticipantRole.INVITEE)
                .filter(participant -> participant.getStatus() == ParticipantStatus.INVITED)
                .forEach(participant -> {
                    participant.setStatus(status);
                    participant.setRespondedAt(LocalDateTime.now());
                });
    }

    private void assertActiveRingingOrAccepted(CallSession session) {
        if (session.getStatus() != CallStatus.RINGING && session.getStatus() != CallStatus.ACCEPTED) {
            throw new IllegalStateException("Call is no longer active");
        }
    }

    private ConversationMember findMember(Conversation conversation, User user) {
        return conversation.getMembers().stream()
                .filter(member -> member.getUser().getId().equals(user.getId()))
                .findFirst()
                .orElseThrow(() -> new SecurityException("User is not a member of this conversation"));
    }

    private CallParticipant findParticipant(CallSession session, User user) {
        return session.getParticipants().stream()
                .filter(participant -> participant.getUser().getId().equals(user.getId()))
                .findFirst()
                .orElseThrow(() -> new SecurityException("User is not a participant in this call"));
    }

    private CallSession loadSession(UUID callId) {
        return videoRepository.findWithParticipantsById(callId)
                .orElseThrow(() -> new EntityNotFoundException("Call not found: " + callId));
    }

    private User loadUser(String usernameOrEmail) {
        return authRepository.findByUsername(usernameOrEmail)
                .orElseGet(() -> authRepository.findByEmail(usernameOrEmail)
                        .orElseThrow(() -> new EntityNotFoundException("User not found: " + usernameOrEmail)));
    }

    private User loadUserByUsername(String username) {
        return authRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));
    }

    private CallType normalizeCallType(CallType callType) {
        return callType == null ? CallType.VIDEO : callType;
    }

    private CallSessionResponse toResponse(CallSession session) {
        Conversation conversation = session.getConversation();
        return CallSessionResponse.builder()
                .id(session.getId())
                .roomName(session.getRoomName())
                .videoUrl(session.getVideoUrl())
                .callType(session.getCallType())
                .scope(session.getScope())
                .status(session.getStatus())
                .callerUsername(session.getCaller().getUsername())
                .conversationId(conversation != null ? conversation.getId() : null)
                .groupName(conversation != null ? conversation.getGroupName() : null)
                .createdAt(session.getCreatedAt())
                .acceptedAt(session.getAcceptedAt())
                .endedAt(session.getEndedAt())
                .expiresAt(session.getExpiresAt())
                .participants(toParticipantResponses(session.getParticipants()))
                .build();
    }

    private CallEvent toEvent(CallSession session, User recipient, String type) {
        Conversation conversation = session.getConversation();
        return CallEvent.builder()
                .type(type)
                .callId(session.getId())
                .roomName(session.getRoomName())
                .videoUrl(session.getVideoUrl())
                .callType(session.getCallType())
                .scope(session.getScope())
                .status(session.getStatus())
                .callerUsername(session.getCaller().getUsername())
                .targetUsername(recipient.getUsername())
                .conversationId(conversation != null ? conversation.getId() : null)
                .groupName(conversation != null ? conversation.getGroupName() : null)
                .participants(toParticipantResponses(session.getParticipants()))
                .build();
    }

    private List<CallParticipantResponse> toParticipantResponses(Collection<CallParticipant> participants) {
        return participants.stream()
                .sorted(Comparator.comparing(participant -> participant.getUser().getUsername()))
                .map(participant -> CallParticipantResponse.builder()
                        .username(participant.getUser().getUsername())
                        .role(participant.getRole())
                        .status(participant.getStatus())
                        .invitedAt(participant.getInvitedAt())
                        .respondedAt(participant.getRespondedAt())
                        .leftAt(participant.getLeftAt())
                        .build())
                .toList();
    }
}

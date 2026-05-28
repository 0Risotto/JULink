package com.graduation.julink.report;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.chat.ChatEntities.Conversation;
import com.graduation.julink.chat.ChatEntities.ConversationMember;
import com.graduation.julink.chat.ChatEntities.Message;
import com.graduation.julink.chat.repo.ConversationMemberRepository;
import com.graduation.julink.chat.repo.MessageRepository;
import com.graduation.julink.post.PostEntities.Post;
import com.graduation.julink.post.PostRepository;
import com.graduation.julink.report.ReportDTOs.ReportRequest;
import com.graduation.julink.report.ReportDTOs.ReportResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {
    @Mock private AuthRepository authRepository;
    @Mock private PostRepository postRepository;
    @Mock private MessageRepository messageRepository;
    @Mock private ConversationMemberRepository conversationMemberRepository;

    private ReportService reportService;
    private Path reportsFile;
    private User reporter;
    private User targetUser;

    @BeforeEach
    void setUp() throws Exception {
        reportService = new ReportService(
                authRepository,
                postRepository,
                messageRepository,
                conversationMemberRepository
        );
        reportsFile = Files.createTempFile("julink-reports", ".txt");
        ReflectionTestUtils.setField(reportService, "reportsPath", reportsFile.toString());

        reporter = user(101L, "reporter");
        targetUser = user(202L, "target");
        lenient().when(authRepository.findById(101L)).thenReturn(Optional.of(reporter));
    }

    @Test
    void createReport_UserTarget_WritesReport() throws Exception {
        when(authRepository.findByUsername("target")).thenReturn(Optional.of(targetUser));

        ReportResponse response = reportService.createReport(
                101L,
                new ReportRequest(ReportTargetType.USER, "target", "Abusive behavior")
        );

        String contents = Files.readString(reportsFile);
        assertEquals("success", response.status());
        assertEquals(ReportTargetType.USER, response.targetType());
        assertEquals("target", response.targetId());
        assertEquals("target", response.targetOwnerUsername());
        assertTrue(contents.contains("targetType=USER"));
        assertTrue(contents.contains("targetId=target"));
        assertTrue(contents.contains("message=Abusive behavior"));
    }

    @Test
    void createReport_UserTarget_RejectsSelfReport() {
        when(authRepository.findByUsername("reporter")).thenReturn(Optional.of(reporter));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> reportService.createReport(
                        101L,
                        new ReportRequest(ReportTargetType.USER, "reporter", "self report")
                )
        );

        assertEquals("Cannot report yourself", exception.getMessage());
    }

    @Test
    void createReport_PostTarget_WritesReport() throws Exception {
        UUID postId = UUID.randomUUID();
        Post post = new Post();
        post.setPostId(postId);
        post.setOwner(targetUser);
        post.setDescription("reported post");
        when(postRepository.findById(postId)).thenReturn(Optional.of(post));

        ReportResponse response = reportService.createReport(
                101L,
                new ReportRequest(ReportTargetType.POST, postId.toString(), "Spam post")
        );

        String contents = Files.readString(reportsFile);
        assertEquals(ReportTargetType.POST, response.targetType());
        assertEquals(postId.toString(), response.targetId());
        assertEquals("target", response.targetOwnerUsername());
        assertTrue(contents.contains("targetType=POST"));
        assertTrue(contents.contains("targetId=" + postId));
    }

    @Test
    void createReport_MessageTarget_AllowsConversationMember() throws Exception {
        Message message = message(55L, targetUser);
        when(messageRepository.findById(55L)).thenReturn(Optional.of(message));
        when(conversationMemberRepository.findByConversationIdAndUserId(77L, 101L))
                .thenReturn(Optional.of(new ConversationMember()));

        ReportResponse response = reportService.createReport(
                101L,
                new ReportRequest(ReportTargetType.MESSAGE, "55", "Bad message")
        );

        String contents = Files.readString(reportsFile);
        assertEquals(ReportTargetType.MESSAGE, response.targetType());
        assertEquals("55", response.targetId());
        assertEquals("target", response.targetOwnerUsername());
        assertTrue(contents.contains("targetType=MESSAGE"));
        assertTrue(contents.contains("targetId=55"));
    }

    @Test
    void createReport_MessageTarget_RejectsNonMember() {
        Message message = message(55L, targetUser);
        when(messageRepository.findById(55L)).thenReturn(Optional.of(message));
        when(conversationMemberRepository.findByConversationIdAndUserId(77L, 101L))
                .thenReturn(Optional.empty());

        SecurityException exception = assertThrows(
                SecurityException.class,
                () -> reportService.createReport(
                        101L,
                        new ReportRequest(ReportTargetType.MESSAGE, "55", "Bad message")
                )
        );

        assertEquals("You are not allowed to report this message", exception.getMessage());
    }

    @Test
    void createReport_SanitizesNewlineAndPipeCharacters() throws Exception {
        when(authRepository.findByUsername("target")).thenReturn(Optional.of(targetUser));

        reportService.createReport(
                101L,
                new ReportRequest(ReportTargetType.USER, "target", "line one\nline two | pipe")
        );

        String contents = Files.readString(reportsFile);
        assertTrue(contents.contains("message=line one line two / pipe"));
    }

    private User user(Long id, String username) {
        User user = new User();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(username + "@ju.edu.jo");
        user.setFirstName(username);
        user.setLastName("User");
        return user;
    }

    private Message message(Long id, User sender) {
        Conversation conversation = new Conversation();
        conversation.setId(77L);

        Message message = new Message();
        message.setId(id);
        message.setConversation(conversation);
        message.setSender(sender);
        message.setContent("bad message");
        return message;
    }
}

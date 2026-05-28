package com.graduation.julink.report;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.chat.ChatEntities.Message;
import com.graduation.julink.chat.repo.ConversationMemberRepository;
import com.graduation.julink.chat.repo.MessageRepository;
import com.graduation.julink.post.PostEntities.Post;
import com.graduation.julink.post.PostRepository;
import com.graduation.julink.report.ReportDTOs.ReportRequest;
import com.graduation.julink.report.ReportDTOs.ReportResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReportService {
    private static final Object REPORTS_FILE_LOCK = new Object();

    private final AuthRepository authRepository;
    private final PostRepository postRepository;
    private final MessageRepository messageRepository;
    private final ConversationMemberRepository conversationMemberRepository;

    @Value("${julink.reports.path:src/main/resources/assets/reports}")
    private String reportsPath;

    @Transactional(readOnly = true)
    public ReportResponse createReport(Long reporterId, ReportRequest request) {
        User reporter = authRepository.findById(reporterId)
                .orElseThrow(() -> new EntityNotFoundException("Reporter not found with id: " + reporterId));
        ResolvedTarget target = resolveTarget(reporter, request);
        LocalDateTime timestamp = LocalDateTime.now();
        String message = request.message().trim();

        appendReport(timestamp, reporter, target, message);

        return new ReportResponse(
                "success",
                timestamp,
                reporter.getId(),
                reporter.getUsername(),
                target.type(),
                target.id(),
                target.ownerUsername(),
                message
        );
    }

    private ResolvedTarget resolveTarget(User reporter, ReportRequest request) {
        return switch (request.targetType()) {
            case USER -> resolveUserTarget(reporter, request.targetId());
            case POST -> resolvePostTarget(request.targetId());
            case MESSAGE -> resolveMessageTarget(reporter, request.targetId());
        };
    }

    private ResolvedTarget resolveUserTarget(User reporter, String targetId) {
        String username = targetId.trim().toLowerCase();
        User target = authRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Reported user not found: " + targetId));

        if (reporter.getId().equals(target.getId())) {
            throw new IllegalArgumentException("Cannot report yourself");
        }

        return new ResolvedTarget(ReportTargetType.USER, target.getUsername(), target.getUsername());
    }

    private ResolvedTarget resolvePostTarget(String targetId) {
        UUID postId = parseUuid(targetId, "Post");
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Reported post not found: " + targetId));

        return new ResolvedTarget(ReportTargetType.POST, post.getPostId().toString(), post.getOwner().getUsername());
    }

    private ResolvedTarget resolveMessageTarget(User reporter, String targetId) {
        Long messageId = parseLong(targetId, "Message");
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new EntityNotFoundException("Reported message not found: " + targetId));

        boolean reporterIsMember = conversationMemberRepository
                .findByConversationIdAndUserId(message.getConversation().getId(), reporter.getId())
                .isPresent();
        if (!reporterIsMember) {
            throw new SecurityException("You are not allowed to report this message");
        }

        return new ResolvedTarget(ReportTargetType.MESSAGE, message.getId().toString(), message.getSender().getUsername());
    }

    private UUID parseUuid(String value, String label) {
        try {
            return UUID.fromString(value.trim());
        } catch (RuntimeException e) {
            throw new IllegalArgumentException(label + " report target id must be a UUID");
        }
    }

    private Long parseLong(String value, String label) {
        try {
            return Long.parseLong(value.trim());
        } catch (RuntimeException e) {
            throw new IllegalArgumentException(label + " report target id must be a number");
        }
    }

    private void appendReport(
            LocalDateTime timestamp,
            User reporter,
            ResolvedTarget target,
            String message
    ) {
        Path path = Path.of(reportsPath);
        Path parent = path.getParent();
        String entry = String.format(
                "timestamp=%s | reporterId=%d | reporterUsername=%s | targetType=%s | targetId=%s | targetOwnerUsername=%s | message=%s%n",
                timestamp,
                reporter.getId(),
                sanitizeReportValue(reporter.getUsername()),
                target.type(),
                sanitizeReportValue(target.id()),
                sanitizeReportValue(target.ownerUsername()),
                sanitizeReportValue(message)
        );

        synchronized (REPORTS_FILE_LOCK) {
            try {
                if (parent != null) {
                    Files.createDirectories(parent);
                }
                Files.writeString(
                        path,
                        entry,
                        StandardCharsets.UTF_8,
                        java.nio.file.StandardOpenOption.CREATE,
                        java.nio.file.StandardOpenOption.APPEND
                );
            } catch (IOException e) {
                throw new UncheckedIOException("Failed to write report", e);
            }
        }
    }

    private String sanitizeReportValue(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace('\r', ' ')
                .replace('\n', ' ')
                .replace('|', '/')
                .trim();
    }

    private record ResolvedTarget(
            ReportTargetType type,
            String id,
            String ownerUsername
    ) {}
}

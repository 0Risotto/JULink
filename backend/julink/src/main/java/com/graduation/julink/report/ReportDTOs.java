package com.graduation.julink.report;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public final class ReportDTOs {
    private ReportDTOs() {}

    public record ReportRequest(
            @NotNull ReportTargetType targetType,
            @NotBlank String targetId,
            @NotBlank @Size(max = 1_000) String message
    ) {}

    public record ReportMessageRequest(
            @NotBlank @Size(max = 1_000) String message
    ) {}

    public record ReportResponse(
            String status,
            LocalDateTime timestamp,
            Long reporterId,
            String reporterUsername,
            ReportTargetType targetType,
            String targetId,
            String targetOwnerUsername,
            String message
    ) {}
}

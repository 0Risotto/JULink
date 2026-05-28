package com.graduation.julink.report;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.report.ReportDTOs.ReportRequest;
import com.graduation.julink.report.ReportDTOs.ReportResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;
    private final AuthRepository authRepository;

    @PostMapping
    public ReportResponse createReport(
            Principal principal,
            @Valid @RequestBody ReportRequest request
    ) {
        return reportService.createReport(currentUser(principal).getId(), request);
    }

    private User currentUser(Principal principal) {
        return authRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new SecurityException("Authenticated user was not found"));
    }
}

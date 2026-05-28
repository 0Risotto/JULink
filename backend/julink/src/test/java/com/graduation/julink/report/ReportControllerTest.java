package com.graduation.julink.report;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.report.ReportDTOs.ReportRequest;
import com.graduation.julink.report.ReportDTOs.ReportResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {
    @Mock private ReportService reportService;
    @Mock private AuthRepository authRepository;
    @Mock private Principal principal;

    @InjectMocks
    private ReportController reportController;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(101L);
        user.setEmail("reporter@ju.edu.jo");
        user.setUsername("reporter");
    }

    @Test
    void createReport_Success() {
        ReportRequest request = new ReportRequest(ReportTargetType.USER, "target", "Abusive behavior");
        ReportResponse expected = new ReportResponse(
                "success",
                LocalDateTime.now(),
                101L,
                "reporter",
                ReportTargetType.USER,
                "target",
                "target",
                "Abusive behavior"
        );

        when(principal.getName()).thenReturn("reporter@ju.edu.jo");
        when(authRepository.findByEmail("reporter@ju.edu.jo")).thenReturn(Optional.of(user));
        when(reportService.createReport(101L, request)).thenReturn(expected);

        ReportResponse response = reportController.createReport(principal, request);

        assertEquals(expected, response);
    }
}

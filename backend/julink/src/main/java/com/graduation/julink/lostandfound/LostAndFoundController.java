package com.graduation.julink.lostandfound;

import com.graduation.julink.auth.AuthEntities;
import com.graduation.julink.auth.CollegeEnum;
import com.graduation.julink.auth.Repository.AuthRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/lost-and-founds")
@RequiredArgsConstructor
public class LostAndFoundController {

    private final LostAndFoundService lostAndFoundService;
    private final AuthRepository authRepository;

    @PostMapping
    public ResponseEntity<LostAndFoundDto.Response> createLostAndFound(
            @Valid @RequestBody LostAndFoundDto.CreateLostAndFound dto,
            Principal principal
    ) {
        AuthEntities.User user = authRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(lostAndFoundService.addLostAndFound(dto, user.getId()));
    }
    @PatchMapping("/{lostAndFoundId}/resolve")
    public ResponseEntity<LostAndFoundDto.Response> markLostAndFoundAsResolved(
            @PathVariable UUID lostAndFoundId,
            Principal principal
    ) {
        AuthEntities.User user = authRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(lostAndFoundService.markAsResolved(lostAndFoundId, user.getId()));
    }

    @PostMapping("/{lostAndFoundId}/claim")
    public ResponseEntity<LostAndFoundDto.ClaimResponse> claimLostAndFound(
            @PathVariable UUID lostAndFoundId,
            @RequestBody(required = false) LostAndFoundDto.ClaimRequest request,
            Principal principal
    ) {
        AuthEntities.User user = authRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(lostAndFoundService.claimLostAndFound(lostAndFoundId, user.getId(), request));
    }

    @GetMapping
    public ResponseEntity<Page<LostAndFoundDto.Response>> getAllLostAndFounds(
            @RequestParam(required = false) CollegeEnum college,
            @RequestParam(required = false) TypeEnum type,
            @RequestParam(required = false) Boolean isResolved,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {

        return ResponseEntity.ok(lostAndFoundService.getLostAndFounds(college, type, isResolved, pageable));
    }
}

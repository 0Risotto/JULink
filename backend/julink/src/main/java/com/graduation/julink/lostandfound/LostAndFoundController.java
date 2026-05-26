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
    @PatchMapping("/{lostAndFoundId}/found")
    public ResponseEntity<LostAndFoundDto.Response> markLostAndFoundAsFound(
            @PathVariable UUID lostAndFoundId,
            Principal principal
    ) {
        AuthEntities.User user = authRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(lostAndFoundService.markAsFound(lostAndFoundId, user.getId()));
    }

    @GetMapping
    public ResponseEntity<Page<LostAndFoundDto.Response>> getAllLostAndFounds(
            @RequestParam(required = false) CollegeEnum college,
            @RequestParam(defaultValue = "false") boolean isResolved,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {

        return ResponseEntity.ok(lostAndFoundService.getLostAndFounds(college, isResolved, pageable));
    }
}

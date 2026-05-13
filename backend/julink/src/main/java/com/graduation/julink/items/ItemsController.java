package com.graduation.julink.items;

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
@RequestMapping("/items")
@RequiredArgsConstructor
public class ItemsController {

    private final ItemsService itemsService;
    private final AuthRepository authRepository;

    @PostMapping
    public ResponseEntity<ItemsDto.Response> createItem(
            @Valid @RequestBody ItemsDto.CreateItem dto,
            Principal principal
    ) {
        AuthEntities.User user = authRepository.findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(itemsService.addItem(dto, user.getId()));
    }
    @PatchMapping("/{itemId}/found")
    public ResponseEntity<ItemsDto.Response> markItemAsFound(
            @PathVariable UUID itemId,
            Principal principal
    ) {
        AuthEntities.User user = authRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(itemsService.markAsFound(itemId, user.getId()));
    }

    @GetMapping
    public ResponseEntity<Page<ItemsDto.Response>> getAllItems(
            @RequestParam(required = false) CollegeEnum college,
            @RequestParam(defaultValue = "false") boolean isResolved,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable
    ) {

        return ResponseEntity.ok(itemsService.getItems(college, isResolved, pageable));
    }
}
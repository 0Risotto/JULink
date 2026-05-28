package com.graduation.julink.block;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/blocks")
@RequiredArgsConstructor
public class BlockController {
    private final BlockService blockService;
    private final AuthRepository authRepository;

    @PostMapping("/{username}")
    public Map<String, Object> blockUser(Principal principal, @PathVariable String username) {
        try {
            blockService.block(currentUsername(principal), username);
            return Map.of("status", "success", "message", "Blocked " + username);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @DeleteMapping("/{username}")
    public Map<String, Object> unblockUser(Principal principal, @PathVariable String username) {
        try {
            blockService.unblock(currentUsername(principal), username);
            return Map.of("status", "success", "message", "Unblocked " + username);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping
    public Map<String, Object> getBlockedUsers(Principal principal) {
        try {
            return Map.of(
                    "status", "success",
                    "blockedUsers", blockService.getBlockedUsers(currentUsername(principal))
            );
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping("/{username}/status")
    public Map<String, Object> getBlockStatus(Principal principal, @PathVariable String username) {
        try {
            return Map.of(
                    "status", "success",
                    "blockStatus", blockService.getStatus(currentUsername(principal), username)
            );
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    private String currentUsername(Principal principal) {
        return authRepository.findByEmail(principal.getName())
                .map(User::getUsername)
                .orElseThrow(() -> new SecurityException("Authenticated user was not found"));
    }
}

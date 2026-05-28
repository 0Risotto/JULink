package com.graduation.julink.follow;

import com.graduation.julink.auth.Repository.AuthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/follow")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;
    private final AuthRepository authRepository;

    @PostMapping("/{username}")
    public Map<String, Object> followUser(Principal principal, @PathVariable String username) {
        String email = principal.getName();
        String followerUsername = getUsernameFromEmail(email);
        try {
            followService.followUser(followerUsername, username);
            return Map.of("status", "success", "message", "You are now following " + username);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @DeleteMapping("/{username}")
    public Map<String, Object> unfollowUser(Principal principal, @PathVariable String username) {
        String email = principal.getName();
        String followerUsername = getUsernameFromEmail(email);
        try {
            followService.unfollowUser(followerUsername, username);
            return Map.of("status", "success", "message", "You have unfollowed " + username);
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping("/{username}/followers")
    public Map<String, Object> getFollowers(Principal principal, @PathVariable String username,
                                            @PageableDefault(size = 20, sort = "username", direction = Sort.Direction.ASC) Pageable pageable) {
        try {
            Page<FollowDTOs.FollowerListDto> followers = followService.getFollowers(username, pageable);
            return Map.of(
                    "status", "success",
                    "followers", followers.getContent(),
                    "totalPages", followers.getTotalPages(),
                    "totalElements", followers.getTotalElements(),
                    "currentPage", followers.getNumber(),
                    "pageSize", followers.getSize()
            );
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping("/{username}/followings")
    public Map<String, Object> getFollowings(Principal principal, @PathVariable String username,
                                             @PageableDefault(size = 20, sort = "username", direction = Sort.Direction.ASC) Pageable pageable) {
        try {
            Page<FollowDTOs.FollowerListDto> followings = followService.getFollowings(username, pageable);
            return Map.of(
                    "status", "success",
                    "followings", followings.getContent(),
                    "totalPages", followings.getTotalPages(),
                    "totalElements", followings.getTotalElements(),
                    "currentPage", followings.getNumber(),
                    "pageSize", followings.getSize()
            );
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }
    @GetMapping("/friends")
    public Map<String, Object> getFriends(Principal principal,
                                          @PageableDefault(size = 100, sort = "username", direction = Sort.Direction.ASC) Pageable pageable) {
        String email = principal.getName();
        String currentUser = getUsernameFromEmail(email);
        try {
            Page<FollowDTOs.FollowerListDto> friendsDtos = followService.getFriends(currentUser, pageable);

            return Map.of(
                    "status", "success",
                    "friends", friendsDtos.getContent(),
                    "totalPages", friendsDtos.getTotalPages(),
                    "totalElements", friendsDtos.getTotalElements(),
                    "currentPage", friendsDtos.getNumber(),
                    "pageSize", friendsDtos.getSize()
            );
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping("/mutual-followings/{otherUsername}")
    public Map<String, Object> getMutualFollowings(Principal principal, @PathVariable String otherUsername,
                                                   @PageableDefault(size = 20, sort = "username", direction = Sort.Direction.ASC) Pageable pageable) {
        String email = principal.getName();
        String currentUser = getUsernameFromEmail(email);
        try {
            Page<String> mutual = followService.getMutualFollowings(currentUser, otherUsername, pageable);
            return Map.of(
                    "status", "success",
                    "mutualFollowings", mutual.getContent(),
                    "totalPages", mutual.getTotalPages(),
                    "totalElements", mutual.getTotalElements(),
                    "currentPage", mutual.getNumber(),
                    "pageSize", mutual.getSize()
            );
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping("/mutual-followers/{otherUsername}")
    public Map<String, Object> getMutualFollowers(Principal principal, @PathVariable String otherUsername,
                                                  @PageableDefault(size = 20, sort = "username", direction = Sort.Direction.ASC) Pageable pageable) {
        String email = principal.getName();
        String currentUser = getUsernameFromEmail(email);
        try {
            Page<String> mutualFollowers = followService.getMutualFollowers(currentUser, otherUsername, pageable);
            return Map.of(
                    "status", "success",
                    "mutualFollowers", mutualFollowers.getContent(),
                    "totalPages", mutualFollowers.getTotalPages(),
                    "totalElements", mutualFollowers.getTotalElements(),
                    "currentPage", mutualFollowers.getNumber(),
                    "pageSize", mutualFollowers.getSize()
            );
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    @GetMapping("/{username}/is-following")
    public Map<String, Object> isFollowing(Principal principal, @PathVariable String username) {
        String email = principal.getName();
        String currentUser = getUsernameFromEmail(email);
        boolean following = followService.isFollowing(currentUser, username);
        return Map.of("status", "success", "following", following);
    }

    @GetMapping("/{username}/mutual")
    public Map<String, Object> isMutual(Principal principal, @PathVariable String username) {
        String email = principal.getName();
        String currentUser = getUsernameFromEmail(email);
        boolean mutual = followService.isMutual(currentUser, username);
        return Map.of("status", "success", "mutual", mutual);
    }

    @GetMapping("/suggestion")
    public Map<String, Object> getSuggestions(Principal principal) {
        String email = principal.getName();
        String username = getUsernameFromEmail(email);

        try {
            List<FollowDTOs.FollowerListDto> suggestions = followService.getSuggestions(username);
            return Map.of(
                    "status", "success",
                    "suggestions", suggestions
            );
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    private String getUsernameFromEmail(String email) {
        return authRepository.findByEmail(email)
                .map(com.graduation.julink.auth.AuthEntities.User::getUsername)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }


}
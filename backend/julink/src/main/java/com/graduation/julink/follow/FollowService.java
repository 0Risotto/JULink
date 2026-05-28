package com.graduation.julink.follow;

import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.block.BlockService;
import com.graduation.julink.notification.NotificationService;
import com.graduation.julink.notification.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final FollowRepository followRepository;
    private final AuthRepository authRepository;
    private final NotificationService notificationService;
    private final BlockService blockService;

//    FollowService(){};

    @Transactional
    public void followUser(String followerUsername, String followeeUsername) {
        if (!authRepository.existsByUsername(followerUsername)) {
            throw new IllegalArgumentException("Follower not found: " + followerUsername);
        }
        if (!authRepository.existsByUsername(followeeUsername)) {
            throw new IllegalArgumentException("Followee not found: " + followeeUsername);
        }
        if (followerUsername.equals(followeeUsername)) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }
        blockService.assertNotBlocked(followerUsername, followeeUsername);
        if (followRepository.isFollowing(followerUsername, followeeUsername)) {
            throw new IllegalStateException("Already following this user");
        }
        followRepository.follow(followerUsername, followeeUsername);
        notifyFollow(followerUsername, followeeUsername);
    }

    @Transactional
    public void unfollowUser(String followerUsername, String followeeUsername) {
        if (!followRepository.isFollowing(followerUsername, followeeUsername)) {
            throw new IllegalStateException("Not following this user");
        }
        followRepository.unfollow(followerUsername, followeeUsername);
    }

    public Page<FollowDTOs.FollowerListDto> getFollowers(String username, Pageable pageable) {
        if (!authRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("User not found: " + username);
        }
        Page<String> followerUsernames = followRepository.getFollowers(username, pageable);
        return followerUsernames.map(followerUsername -> {
            return authRepository.findByUsername(followerUsername)
                    .map(user -> new FollowDTOs.FollowerListDto(
                            user.getUsername(),
                            user.getFirstName() + " " + user.getLastName(),
                            user.getProfilePictureUrl()
                    ))
                    .orElseGet(() -> new FollowDTOs.FollowerListDto(followerUsername, "Unknown User", null));
        });
    }

    public Page<FollowDTOs.FollowerListDto> getFollowings(String username, Pageable pageable) {
        if (!authRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("User not found: " + username);
        }

        Page<String> followingUsernames = followRepository.getFollowings(username, pageable);

        return followingUsernames.map(followingUsername -> {
            return authRepository.findByUsername(followingUsername)
                    .map(user -> new FollowDTOs.FollowerListDto(
                            user.getUsername(),
                            user.getFirstName() + " " + user.getLastName(),
                            user.getProfilePictureUrl()
                    ))
                    // It now takes 3 arguments: username, "Unknown User" (Full Name), and null (Profile Pic)
                    .orElseGet(() -> new FollowDTOs.FollowerListDto(followingUsername, "Unknown User", null));
        });
    }

    public Page<FollowDTOs.FollowerListDto> getFriends(String username, Pageable pageable) {
        if (!authRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("User not found: " + username);
        }

        Page<String> friendUsernames = followRepository.getFriends(username, pageable);

        return friendUsernames.map(friendUsername -> {
            return authRepository.findByUsername(friendUsername)
                    .map(user -> new FollowDTOs.FollowerListDto(
                            user.getUsername(),
                            user.getFirstName() + " " + user.getLastName(),
                            user.getProfilePictureUrl()
                    ))
                    .orElseGet(() -> new FollowDTOs.FollowerListDto(friendUsername, "Unknown User", null));
        });
    }

    public Page<String> getMutualFollowings(String username1, String username2, Pageable pageable) {
        if (!authRepository.existsByUsername(username1)) {
            throw new IllegalArgumentException("User not found: " + username1);
        }
        if (!authRepository.existsByUsername(username2)) {
            throw new IllegalArgumentException("User not found: " + username2);
        }
        return followRepository.getMutualFollowings(username1, username2, pageable);
    }

    public Page<String> getMutualFollowers(String username1, String username2, Pageable pageable) {
        if (!authRepository.existsByUsername(username1)) {
            throw new IllegalArgumentException("User not found: " + username1);
        }
        if (!authRepository.existsByUsername(username2)) {
            throw new IllegalArgumentException("User not found: " + username2);
        }
        if (username1.equals(username2)) {
            throw new IllegalArgumentException("Cannot get mutual followers with yourself");
        }

        return followRepository.getMutualFollowers(username1, username2, pageable);
    }

    public boolean isFollowing(String followerUsername, String followeeUsername) {
        return followRepository.isFollowing(followerUsername, followeeUsername);
    }

    public Collection<String> getFollowingUsernames(String username) {
        return followRepository.getFollowingUsernames(username);
    }

    public boolean isMutual(String username1, String username2) {
        return followRepository.isMutual(username1, username2);
    }

    public List<FollowDTOs.FollowerListDto> getSuggestions(String userName) {
        Collection<String> suggestionsList = followRepository.fetchSuggestions(userName);

        if (suggestionsList.isEmpty()) {
            return List.of();
        }
        return authRepository.findByUsernameIn(suggestionsList).stream()
                .map(user -> new FollowDTOs.FollowerListDto(
                        user.getUsername(),
                        user.getFirstName() + " " + user.getLastName(),
                        user.getProfilePictureUrl()
                ))
                .toList();

    }

    private void notifyFollow(String followerUsername, String followeeUsername) {
        if (notificationService == null) {
            return;
        }
        try {
            authRepository.findByUsername(followerUsername).ifPresent(follower ->
                    authRepository.findByUsername(followeeUsername).ifPresent(followee ->
                            notificationService.notifyUser(
                                    followee,
                                    follower,
                                    NotificationType.FOLLOWED_YOU,
                                    follower.getUsername() + " followed you",
                                    "PROFILE",
                                    follower.getUsername(),
                                    null
                            )
                    )
            );
        } catch (RuntimeException ignored) {
            // Notifications should not break the follow action.
        }
    }
}

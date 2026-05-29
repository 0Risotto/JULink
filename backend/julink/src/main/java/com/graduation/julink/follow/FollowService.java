package com.graduation.julink.follow;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.block.BlockService;
import com.graduation.julink.notification.NotificationService;
import com.graduation.julink.notification.NotificationType;
import com.graduation.julink.post.PostEntities.Post;
import com.graduation.julink.post.PostRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowService {
    private static final int SUGGESTION_CANDIDATE_POOL_SIZE = 100;
    private static final int MAX_SUGGESTIONS = 15;

    private final FollowRepository followRepository;
    private final AuthRepository authRepository;
    private final NotificationService notificationService;
    private final BlockService blockService;
    private final PostRepository postRepository;

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

    @Transactional(readOnly = true)
    public List<FollowDTOs.FollowerListDto> getSuggestions(String userName) {
        User currentUser = authRepository.findByUsername(userName)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userName));
        Set<String> followingUsernames = followingUsernamesFor(userName);
        Set<Long> blockedUserIds = blockService.blockedUserIdsFor(currentUser.getId());

        Pageable candidatePage = PageRequest.of(
                0,
                SUGGESTION_CANDIDATE_POOL_SIZE,
                Sort.by(Sort.Direction.DESC, "createdAt")
        );
        List<Post> candidates = postRepository.findAllByOrderByCreatedAtDesc(candidatePage).getContent();
        if (candidates.isEmpty()) {
            return List.of();
        }

        List<UUID> candidatePostIds = candidates.stream().map(Post::getPostId).toList();
        Set<UUID> seenPostIds = candidatePostIds.isEmpty()
                ? Set.of()
                : new HashSet<>(postRepository.findSeenPostIdsByUserIdAndPostIds(currentUser.getId(), candidatePostIds));

        Map<String, SuggestionCandidate> candidatesByUsername = new HashMap<>();
        for (Post post : candidates) {
            User owner = post.getOwner();
            if (owner == null
                    || owner.getId().equals(currentUser.getId())
                    || blockedUserIds.contains(owner.getId())
                    || followingUsernames.contains(owner.getUsername())) {
                continue;
            }

            SuggestionCandidate candidate = candidatesByUsername.computeIfAbsent(
                    owner.getUsername(),
                    ignored -> new SuggestionCandidate(owner)
            );
            candidate.addPost(feedScore(post, currentUser, seenPostIds), post.getCreatedAt());
        }

        return candidatesByUsername.values()
                .stream()
                .sorted(SuggestionCandidate.ORDERING)
                .limit(MAX_SUGGESTIONS)
                .map(candidate -> toFollowerListDto(candidate.user()))
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

    private Set<String> followingUsernamesFor(String username) {
        try {
            return new HashSet<>(followRepository.getFollowingUsernames(username));
        } catch (RuntimeException ignored) {
            return Set.of();
        }
    }

    private double feedScore(Post post, User currentUser, Set<UUID> seenPostIds) {
        double sameSchoolScore = Objects.equals(post.getOwner().getCollege(), currentUser.getCollege()) ? 40.0 : 0.0;
        double recencyScore = recencyScore(post.getCreatedAt()) * 20.0;
        double seenPenalty = seenPostIds.contains(post.getPostId()) ? 15.0 : 0.0;
        return sameSchoolScore + recencyScore - seenPenalty;
    }

    private double recencyScore(LocalDateTime createdAt) {
        if (createdAt == null) {
            return 0.0;
        }
        long hours = Math.max(0, ChronoUnit.HOURS.between(createdAt, LocalDateTime.now()));
        return Math.exp(-hours / 72.0);
    }

    private FollowDTOs.FollowerListDto toFollowerListDto(User user) {
        return new FollowDTOs.FollowerListDto(
                user.getUsername(),
                user.getFirstName() + " " + user.getLastName(),
                user.getProfilePictureUrl()
        );
    }

    private static final class SuggestionCandidate {
        private static final Comparator<SuggestionCandidate> ORDERING = Comparator
                .comparingInt(SuggestionCandidate::occurrences).reversed()
                .thenComparing(Comparator.comparingDouble(SuggestionCandidate::score).reversed())
                .thenComparing(SuggestionCandidate::latestPostAt, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(candidate -> candidate.user().getUsername());

        private final User user;
        private int occurrences;
        private double score;
        private LocalDateTime latestPostAt;

        private SuggestionCandidate(User user) {
            this.user = user;
        }

        private void addPost(double postScore, LocalDateTime postCreatedAt) {
            occurrences++;
            score += postScore;
            if (latestPostAt == null || (postCreatedAt != null && postCreatedAt.isAfter(latestPostAt))) {
                latestPostAt = postCreatedAt;
            }
        }

        private User user() {
            return user;
        }

        private int occurrences() {
            return occurrences;
        }

        private double score() {
            return score;
        }

        private LocalDateTime latestPostAt() {
            return latestPostAt;
        }
    }
}

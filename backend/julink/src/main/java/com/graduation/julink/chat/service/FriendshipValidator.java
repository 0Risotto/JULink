package com.graduation.julink.chat.service;

import com.graduation.julink.block.BlockService;
import com.graduation.julink.follow.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Thin wrapper around the Neo4j-backed FollowRepository that answers the
 * single question ChatService cares about:
 *   "Are these two users mutual follows (i.e. friends)?"
 */
@Component
@RequiredArgsConstructor
public class FriendshipValidator {

    private final FollowRepository followRepository;
    private final BlockService blockService;

    /**
     * Returns true if username1 and username2 mutually follow each other.
     * Delegates directly to {@link FollowRepository#isMutual(String, String)}.
     */
    public boolean areFriends(String username1, String username2) {
        if (blockService.isBlockedEitherWay(username1, username2)) {
            return false;
        }
        return followRepository.isMutual(username1, username2);
    }

    /**
     * Throws {@link SecurityException} if the two users are not friends.
     * Use this as a guard before any chat operation that requires friendship.
     */
    public void assertFriends(String username1, String username2) {
        if (!areFriends(username1, username2)) {
            throw new SecurityException(
                    "Users '%s' and '%s' must be mutual follows to interact in chat."
                            .formatted(username1, username2));
        }
    }

    public void assertNotBlocked(String username1, String username2) {
        blockService.assertNotBlocked(username1, username2);
    }
}

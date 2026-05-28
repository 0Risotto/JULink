package com.graduation.julink.block;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.block.BlockDTOs.BlockStatusDto;
import com.graduation.julink.block.BlockDTOs.BlockedUserDto;
import com.graduation.julink.block.BlockEntities.UserBlock;
import com.graduation.julink.follow.FollowRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BlockService {
    private final BlockRepository blockRepository;
    private final AuthRepository authRepository;
    private final FollowRepository followRepository;
    private final BlockGraphRepository blockGraphRepository;

    @Transactional
    public void block(String blockerUsername, String blockedUsername) {
        User blocker = getUser(blockerUsername);
        User blocked = getUser(blockedUsername);
        if (blocker.getId().equals(blocked.getId())) {
            throw new IllegalArgumentException("Cannot block yourself");
        }

        if (!blockRepository.existsByBlocker_IdAndBlocked_Id(blocker.getId(), blocked.getId())) {
            UserBlock userBlock = new UserBlock();
            userBlock.setBlocker(blocker);
            userBlock.setBlocked(blocked);
            try {
                blockRepository.saveAndFlush(userBlock);
            } catch (DataIntegrityViolationException ignored) {
                // Another request created the same block.
            }
        }

        followRepository.unfollow(blocker.getUsername(), blocked.getUsername());
        followRepository.unfollow(blocked.getUsername(), blocker.getUsername());
        blockGraphRepository.block(blocker.getUsername(), blocked.getUsername());
    }

    @Transactional
    public void unblock(String blockerUsername, String blockedUsername) {
        User blocker = getUser(blockerUsername);
        User blocked = getUser(blockedUsername);
        blockRepository.deleteByBlocker_IdAndBlocked_Id(blocker.getId(), blocked.getId());
        blockGraphRepository.unblock(blocker.getUsername(), blocked.getUsername());
    }

    @Transactional(readOnly = true)
    public List<BlockedUserDto> getBlockedUsers(String blockerUsername) {
        User blocker = getUser(blockerUsername);
        return blockRepository.findByBlocker_IdOrderByCreatedAtDesc(blocker.getId())
                .stream()
                .map(block -> {
                    User blocked = block.getBlocked();
                    return new BlockedUserDto(
                            blocked.getUsername(),
                            blocked.getFirstName() + " " + blocked.getLastName(),
                            blocked.getProfilePictureUrl(),
                            block.getCreatedAt()
                    );
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public BlockStatusDto getStatus(String currentUsername, String otherUsername) {
        User current = getUser(currentUsername);
        User other = getUser(otherUsername);
        boolean blockedByMe = blockRepository.existsByBlocker_IdAndBlocked_Id(current.getId(), other.getId());
        boolean blockedMe = blockRepository.existsByBlocker_IdAndBlocked_Id(other.getId(), current.getId());
        return new BlockStatusDto(blockedByMe, blockedMe, blockedByMe || blockedMe);
    }

    @Transactional(readOnly = true)
    public boolean isBlockedEitherWay(String username1, String username2) {
        if (username1 == null || username2 == null || username1.equals(username2)) {
            return false;
        }
        return blockRepository.existsByBlocker_UsernameAndBlocked_Username(username1, username2)
                || blockRepository.existsByBlocker_UsernameAndBlocked_Username(username2, username1);
    }

    @Transactional(readOnly = true)
    public Set<Long> blockedUserIdsFor(Long userId) {
        Set<Long> ids = new HashSet<>();
        blockRepository.findByBlocker_IdOrBlocked_Id(userId, userId).forEach(block -> {
            if (block.getBlocker().getId().equals(userId)) {
                ids.add(block.getBlocked().getId());
            } else {
                ids.add(block.getBlocker().getId());
            }
        });
        return ids;
    }

    @Transactional(readOnly = true)
    public boolean isBlockedEitherWay(Long userId1, Long userId2) {
        if (userId1 == null || userId2 == null || userId1.equals(userId2)) {
            return false;
        }
        return blockRepository.existsByBlocker_IdAndBlocked_Id(userId1, userId2)
                || blockRepository.existsByBlocker_IdAndBlocked_Id(userId2, userId1);
    }

    @Transactional
    public void deleteAllForUser(Long userId) {
        blockRepository.deleteByBlocker_IdOrBlocked_Id(userId, userId);
    }

    public void assertNotBlocked(String username1, String username2) {
        if (isBlockedEitherWay(username1, username2)) {
            throw new SecurityException("Users cannot interact because one has blocked the other");
        }
    }

    public void assertNotBlocked(Long userId1, Long userId2) {
        if (isBlockedEitherWay(userId1, userId2)) {
            throw new SecurityException("Users cannot interact because one has blocked the other");
        }
    }

    private User getUser(String username) {
        return authRepository.findByUsername(username.toLowerCase().trim())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + username));
    }
}

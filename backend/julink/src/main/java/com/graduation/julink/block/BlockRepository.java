package com.graduation.julink.block;

import com.graduation.julink.block.BlockEntities.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlockRepository extends JpaRepository<UserBlock, Long> {
    boolean existsByBlocker_IdAndBlocked_Id(Long blockerId, Long blockedId);
    boolean existsByBlocker_UsernameAndBlocked_Username(String blockerUsername, String blockedUsername);
    Optional<UserBlock> findByBlocker_IdAndBlocked_Id(Long blockerId, Long blockedId);
    List<UserBlock> findByBlocker_IdOrderByCreatedAtDesc(Long blockerId);
    List<UserBlock> findByBlocker_IdOrBlocked_Id(Long blockerId, Long blockedId);
    void deleteByBlocker_IdAndBlocked_Id(Long blockerId, Long blockedId);
    void deleteByBlocker_IdOrBlocked_Id(Long blockerId, Long blockedId);
}

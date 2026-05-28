package com.graduation.julink.block;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.block.BlockEntities.UserBlock;
import com.graduation.julink.follow.FollowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BlockServiceTest {
    @Mock private BlockRepository blockRepository;
    @Mock private AuthRepository authRepository;
    @Mock private FollowRepository followRepository;
    @Mock private BlockGraphRepository blockGraphRepository;

    private BlockService blockService;
    private User blocker;
    private User blocked;

    @BeforeEach
    void setUp() {
        blockService = new BlockService(blockRepository, authRepository, followRepository, blockGraphRepository);

        blocker = new User();
        blocker.setId(1L);
        blocker.setUsername("blocker");

        blocked = new User();
        blocked.setId(2L);
        blocked.setUsername("blocked");
    }

    @Test
    void block_CreatesPostgresRecordNeo4jMirrorAndRemovesFollows() {
        when(authRepository.findByUsername("blocker")).thenReturn(Optional.of(blocker));
        when(authRepository.findByUsername("blocked")).thenReturn(Optional.of(blocked));
        when(blockRepository.existsByBlocker_IdAndBlocked_Id(1L, 2L)).thenReturn(false);

        blockService.block("blocker", "blocked");

        ArgumentCaptor<UserBlock> captor = ArgumentCaptor.forClass(UserBlock.class);
        verify(blockRepository).saveAndFlush(captor.capture());
        assertEquals(blocker, captor.getValue().getBlocker());
        assertEquals(blocked, captor.getValue().getBlocked());
        verify(followRepository).unfollow("blocker", "blocked");
        verify(followRepository).unfollow("blocked", "blocker");
        verify(blockGraphRepository).block("blocker", "blocked");
    }

    @Test
    void block_RejectsSelfBlock() {
        when(authRepository.findByUsername("blocker")).thenReturn(Optional.of(blocker));

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> blockService.block("blocker", "blocker")
        );

        assertEquals("Cannot block yourself", exception.getMessage());
        verifyNoInteractions(followRepository, blockGraphRepository);
    }

    @Test
    void unblock_RemovesPostgresRecordAndNeo4jMirror() {
        when(authRepository.findByUsername("blocker")).thenReturn(Optional.of(blocker));
        when(authRepository.findByUsername("blocked")).thenReturn(Optional.of(blocked));

        blockService.unblock("blocker", "blocked");

        verify(blockRepository).deleteByBlocker_IdAndBlocked_Id(1L, 2L);
        verify(blockGraphRepository).unblock("blocker", "blocked");
    }
}

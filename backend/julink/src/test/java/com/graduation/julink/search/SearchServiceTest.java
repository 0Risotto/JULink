package com.graduation.julink.search;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.post.PostEntities.*;
import com.graduation.julink.search.SearchDTOs.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private AuthRepository authRepository;

    @Mock
    private SearchUserRepository userRepository;

    @Mock
    private SearchPostRepository postRepository;

    @Mock
    private SearchHashtagRepository hashtagRepository;

    @Mock
    private Principal principal;

    @InjectMocks
    private SearchService searchService;

    private final Pageable pageable = PageRequest.of(0, 10);
    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(101L);
        currentUser.setEmail("current@ju.edu.jo");
        currentUser.setUsername("currentuser");
    }

    private void mockCurrentUser() {
        when(principal.getName()).thenReturn("current@ju.edu.jo");
        when(authRepository.findByEmail("current@ju.edu.jo")).thenReturn(Optional.of(currentUser));
    }

    @Test
    void searchUsers_BlankQuery_ReturnsEmptyPage() {
        Page<UserSearchResultDTO> result = searchService.searchUsers(" ", pageable, principal);

        assertTrue(result.isEmpty());
        verifyNoInteractions(authRepository, userRepository, postRepository, hashtagRepository);
    }

    @Test
    void searchUsers_ShortQuery_ReturnsEmptyPage() {
        Page<UserSearchResultDTO> result = searchService.searchUsers("a", pageable, principal);

        assertTrue(result.isEmpty());
        verifyNoInteractions(authRepository, userRepository, postRepository, hashtagRepository);
    }

    @Test
    void searchUsers_Success() {
        mockCurrentUser();
        User user = new User();
        user.setId(202L);
        user.setUsername("jane");
        user.setFirstName("Jane");
        user.setLastName("Doe");
        user.setEmail("jane@ju.edu.jo");
        user.setProfilePictureUrl("pfp-url");
        user.setCollege("KING_ABDULLAH_II_IT");

        when(userRepository.searchUsers("ja", 101L, pageable))
                .thenReturn(new PageImpl<>(List.of(user), pageable, 1));

        Page<UserSearchResultDTO> result = searchService.searchUsers(" ja ", pageable, principal);

        assertEquals(1, result.getTotalElements());
        UserSearchResultDTO dto = result.getContent().get(0);
        assertEquals(202L, dto.id());
        assertEquals("jane", dto.username());
        assertEquals("Jane", dto.firstName());
        assertEquals("Doe", dto.lastName());
        assertEquals("pfp-url", dto.profilePictureUrl());
        assertEquals("KING_ABDULLAH_II_IT", dto.college());
        verify(userRepository).searchUsers("ja", 101L, pageable);
    }

    @Test
    void searchPosts_Success() {
        mockCurrentUser();
        User owner = new User();
        owner.setId(202L);
        owner.setUsername("owner");
        owner.setFirstName("Post");
        owner.setLastName("Owner");
        owner.setProfilePictureUrl("owner-pfp");

        UUID postId = UUID.randomUUID();
        LocalDateTime createdAt = LocalDateTime.now().minusDays(1);
        LocalDateTime updatedAt = LocalDateTime.now();

        Post post = new Post();
        post.setPostId(postId);
        post.setOwner(owner);
        post.setDescription("computer science event");
        post.setVisibility(PostVisibility.PUBLIC);
        post.setCreatedAt(createdAt);
        post.setUpdatedAt(updatedAt);

        when(postRepository.searchPosts("science", "PUBLIC", 101L, pageable))
                .thenReturn(new PageImpl<>(List.of(post), pageable, 1));

        Page<PostSearchResultDTO> result = searchService.searchPosts("science", pageable, principal);

        assertEquals(1, result.getTotalElements());
        PostSearchResultDTO dto = result.getContent().get(0);
        assertEquals(postId, dto.postId());
        assertEquals(202L, dto.ownerId());
        assertEquals("owner", dto.ownerUsername());
        assertEquals("computer science event", dto.description());
        assertEquals("PUBLIC", dto.visibility());
        assertEquals(createdAt, dto.createdAt());
        assertEquals(updatedAt, dto.updatedAt());
        verify(postRepository).searchPosts("science", "PUBLIC", 101L, pageable);
    }

    @Test
    void searchHashtags_Success() {
        mockCurrentUser();
        UUID hashtagId = UUID.randomUUID();
        Hashtag hashtag = new Hashtag();
        hashtag.setHashtagId(hashtagId);
        hashtag.setName("ai");

        when(hashtagRepository.searchHashtags("ai", "PUBLIC", 101L, pageable))
                .thenReturn(new PageImpl<>(List.of(hashtag), pageable, 1));

        Page<HashtagSearchResultDTO> result = searchService.searchHashtags("ai", pageable, principal);

        assertEquals(1, result.getTotalElements());
        HashtagSearchResultDTO dto = result.getContent().get(0);
        assertEquals(hashtagId, dto.hashtagId());
        assertEquals("ai", dto.name());
        verify(hashtagRepository).searchHashtags("ai", "PUBLIC", 101L, pageable);
    }
}

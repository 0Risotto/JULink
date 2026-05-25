package com.graduation.julink.search;

import com.graduation.julink.search.SearchDTOs.*;
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
import java.util.Collections;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchControllerTest {

    @Mock
    private SearchService searchService;

    @Mock
    private Principal principal;

    @InjectMocks
    private SearchController searchController;

    private final Pageable pageable = PageRequest.of(0, 10);

    @Test
    void searchUsers_Success() {
        Page<UserSearchResultDTO> page = new PageImpl<>(Collections.emptyList(), pageable, 0);
        when(searchService.searchUsers("jo", pageable, principal)).thenReturn(page);

        Page<UserSearchResultDTO> result = searchController.searchUsers("jo", pageable, principal);

        assertEquals(page, result);
        verify(searchService).searchUsers("jo", pageable, principal);
    }

    @Test
    void searchPosts_Success() {
        Page<PostSearchResultDTO> page = new PageImpl<>(Collections.emptyList(), pageable, 0);
        when(searchService.searchPosts("event", pageable, principal)).thenReturn(page);

        Page<PostSearchResultDTO> result = searchController.searchPosts("event", pageable, principal);

        assertEquals(page, result);
        verify(searchService).searchPosts("event", pageable, principal);
    }

    @Test
    void searchHashtags_Success() {
        Page<HashtagSearchResultDTO> page = new PageImpl<>(Collections.emptyList(), pageable, 0);
        when(searchService.searchHashtags("ai", pageable, principal)).thenReturn(page);

        Page<HashtagSearchResultDTO> result = searchController.searchHashtags("ai", pageable, principal);

        assertEquals(page, result);
        verify(searchService).searchHashtags("ai", pageable, principal);
    }

    @Test
    void search_GlobalEndpoint_ReturnsAllResultGroups() {
        Page<UserSearchResultDTO> users = new PageImpl<>(Collections.emptyList(), pageable, 0);
        Page<PostSearchResultDTO> posts = new PageImpl<>(Collections.emptyList(), pageable, 0);
        Page<HashtagSearchResultDTO> hashtags = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(searchService.searchUsers("ai", pageable, principal)).thenReturn(users);
        when(searchService.searchPosts("ai", pageable, principal)).thenReturn(posts);
        when(searchService.searchHashtags("ai", pageable, principal)).thenReturn(hashtags);

        Map<String, Object> result = searchController.search("ai", pageable, principal);

        assertEquals(users, result.get("users"));
        assertEquals(posts, result.get("posts"));
        assertEquals(hashtags, result.get("hashtags"));
        verify(searchService).searchUsers("ai", pageable, principal);
        verify(searchService).searchPosts("ai", pageable, principal);
        verify(searchService).searchHashtags("ai", pageable, principal);
    }
}

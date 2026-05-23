package com.graduation.julink.search;

import com.graduation.julink.search.SearchDTOs.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping("/users")
    public Page<UserSearchResultDTO> searchUsers(
            @RequestParam(required = false) String q,
            Pageable pageable,
            Principal principal
    ) {
        return searchService.searchUsers(q, pageable, principal);
    }

    @GetMapping("/posts")
    public Page<PostSearchResultDTO> searchPosts(
            @RequestParam(required = false) String q,
            Pageable pageable,
            Principal principal
    ) {
        return searchService.searchPosts(q, pageable, principal);
    }

    @GetMapping("/hashtags")
    public Page<HashtagSearchResultDTO> searchHashtags(
            @RequestParam(required = false) String q,
            Pageable pageable,
            Principal principal
    ) {
        return searchService.searchHashtags(q, pageable, principal);
    }

    @GetMapping
    public Map<String, Object> search(
            @RequestParam(required = false) String q,
            Pageable pageable,
            Principal principal
    ) {
        return Map.of(
                "users", searchService.searchUsers(q, pageable, principal),
                "posts", searchService.searchPosts(q, pageable, principal),
                "hashtags", searchService.searchHashtags(q, pageable, principal)
        );
    }
}

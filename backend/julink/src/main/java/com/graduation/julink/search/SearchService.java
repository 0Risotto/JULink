package com.graduation.julink.search;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.auth.Repository.AuthRepository;
import com.graduation.julink.post.PostEntities.*;
import com.graduation.julink.search.SearchDTOs.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final AuthRepository authRepository;
    private final SearchUserRepository userRepository;
    private final SearchPostRepository postRepository;
    private final SearchHashtagRepository hashtagRepository;

    @Transactional(readOnly = true)
    public Page<UserSearchResultDTO> searchUsers(String q, Pageable pageable, Principal principal) {
        String query = normalizeQuery(q);
        if (query == null) {
            return Page.empty(pageable);
        }

        Long currentUserId = currentUserId(principal);

        return userRepository
                .searchUsers(query, currentUserId, pageable)
                .map(this::toUserSearchResult);
    }

    @Transactional(readOnly = true)
    public Page<PostSearchResultDTO> searchPosts(String q, Pageable pageable, Principal principal) {
        String query = normalizeQuery(q);
        if (query == null) {
            return Page.empty(pageable);
        }

        Long currentUserId = currentUserId(principal);

        return postRepository
                .searchPosts(query, currentUserId, pageable)
                .map(this::toPostSearchResult);
    }

    @Transactional(readOnly = true)
    public Page<HashtagSearchResultDTO> searchHashtags(String q, Pageable pageable, Principal principal) {
        String query = normalizeQuery(q);
        if (query == null) {
            return Page.empty(pageable);
        }

        Long currentUserId = currentUserId(principal);

        return hashtagRepository
                .searchHashtags(query, currentUserId, pageable)
                .map(this::toHashtagSearchResult);
    }

    private String normalizeQuery(String q) {
        if (q == null) {
            return null;
        }

        String query = q.trim();
        return query.length() < 2 ? null : query;
    }

    private Long currentUserId(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return null;
        }

        return authRepository.findByEmail(principal.getName())
                .map(User::getId)
                .orElse(null);
    }

    private UserSearchResultDTO toUserSearchResult(User user) {
        return new UserSearchResultDTO(
                user.getId(),
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePictureUrl(),
                user.getCollege()
        );
    }

    private PostSearchResultDTO toPostSearchResult(Post post) {
        User owner = post.getOwner();

        return new PostSearchResultDTO(
                post.getPostId(),
                owner.getId(),
                owner.getUsername(),
                owner.getFirstName(),
                owner.getLastName(),
                owner.getProfilePictureUrl(),
                post.getDescription(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }

    private HashtagSearchResultDTO toHashtagSearchResult(Hashtag hashtag) {
        return new HashtagSearchResultDTO(
                hashtag.getHashtagId(),
                hashtag.getName()
        );
    }
}

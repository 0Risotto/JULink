package com.graduation.julink.search;

import com.graduation.julink.auth.AuthEntities.User;
import com.graduation.julink.post.PostEntities.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

interface SearchUserRepository extends JpaRepository<User, Long> {

    @Query("""
            SELECT u
            FROM #{#entityName} u
            WHERE (
            LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(u.college) LIKE LOWER(CONCAT('%', :q, '%'))
            )
            AND (:currentUserId IS NULL OR u.id <> :currentUserId)
            """)
    Page<User> searchUsers(
            @Param("q") String q,
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
}

interface SearchPostRepository extends JpaRepository<Post, UUID> {

    @Query("""
            SELECT p
            FROM #{#entityName} p
            WHERE p.visibility = :visibility
            AND LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))
            AND (:currentUserId IS NULL OR p.owner.id <> :currentUserId)
            ORDER BY p.createdAt DESC
            """)
    Page<Post> searchPosts(
            @Param("q") String q,
            @Param("visibility") PostVisibility visibility,
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
}

interface SearchHashtagRepository extends JpaRepository<Hashtag, UUID> {

    @Query(
            value = """
            SELECT h
            FROM #{#entityName} h
            JOIN PostHashtag ph ON ph.hashtag = h
            WHERE LOWER(h.name) LIKE LOWER(CONCAT('%', :q, '%'))
            AND ph.post.visibility = :visibility
            AND (:currentUserId IS NULL OR ph.post.owner.id <> :currentUserId)
            GROUP BY h
            ORDER BY h.name ASC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT h)
            FROM #{#entityName} h
            JOIN PostHashtag ph ON ph.hashtag = h
            WHERE LOWER(h.name) LIKE LOWER(CONCAT('%', :q, '%'))
            AND ph.post.visibility = :visibility
            AND (:currentUserId IS NULL OR ph.post.owner.id <> :currentUserId)
            """
    )
    Page<Hashtag> searchHashtags(
            @Param("q") String q,
            @Param("visibility") PostVisibility visibility,
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
}

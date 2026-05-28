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

    @Query(
            value = """
            SELECT *
            FROM users u
            WHERE (:currentUserId IS NULL OR u.id <> :currentUserId)
            AND (
                :currentUserId IS NULL
                OR NOT EXISTS (
                    SELECT 1 FROM user_blocks b
                    WHERE (b.blocker_id = :currentUserId AND b.blocked_id = u.id)
                       OR (b.blocker_id = u.id AND b.blocked_id = :currentUserId)
                )
            )
            AND (
                LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(u.first_name) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(u.last_name) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(u.college) LIKE LOWER(CONCAT('%', :q, '%'))
                OR u.username % :q
                OR u.first_name % :q
                OR u.last_name % :q
                OR u.email % :q
                OR u.college % :q
            )
            ORDER BY GREATEST(
                similarity(u.username, :q),
                similarity(u.first_name, :q),
                similarity(u.last_name, :q),
                similarity(u.email, :q),
                similarity(u.college, :q)
            ) DESC, u.username ASC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM users u
            WHERE (:currentUserId IS NULL OR u.id <> :currentUserId)
            AND (
                :currentUserId IS NULL
                OR NOT EXISTS (
                    SELECT 1 FROM user_blocks b
                    WHERE (b.blocker_id = :currentUserId AND b.blocked_id = u.id)
                       OR (b.blocker_id = u.id AND b.blocked_id = :currentUserId)
                )
            )
            AND (
                LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(u.first_name) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(u.last_name) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
                OR LOWER(u.college) LIKE LOWER(CONCAT('%', :q, '%'))
                OR u.username % :q
                OR u.first_name % :q
                OR u.last_name % :q
                OR u.email % :q
                OR u.college % :q
            )
            """,
            nativeQuery = true
    )
    Page<User> searchUsers(
            @Param("q") String q,
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
}

interface SearchPostRepository extends JpaRepository<Post, UUID> {

    @Query(
            value = """
            SELECT *
            FROM posts p
            WHERE (:currentUserId IS NULL OR p.owner_id <> :currentUserId)
            AND (
                :currentUserId IS NULL
                OR NOT EXISTS (
                    SELECT 1 FROM user_blocks b
                    WHERE (b.blocker_id = :currentUserId AND b.blocked_id = p.owner_id)
                       OR (b.blocker_id = p.owner_id AND b.blocked_id = :currentUserId)
                )
            )
            AND (
                LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))
                OR p.description % :q
            )
            ORDER BY similarity(p.description, :q) DESC, p.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM posts p
            WHERE (:currentUserId IS NULL OR p.owner_id <> :currentUserId)
            AND (
                :currentUserId IS NULL
                OR NOT EXISTS (
                    SELECT 1 FROM user_blocks b
                    WHERE (b.blocker_id = :currentUserId AND b.blocked_id = p.owner_id)
                       OR (b.blocker_id = p.owner_id AND b.blocked_id = :currentUserId)
                )
            )
            AND (
                LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%'))
                OR p.description % :q
            )
            """,
            nativeQuery = true
    )
    Page<Post> searchPosts(
            @Param("q") String q,
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
}

interface SearchHashtagRepository extends JpaRepository<Hashtag, UUID> {

    @Query(
            value = """
            SELECT h.*
            FROM hashtags h
            JOIN post_hashtags ph ON ph.hashtag_id = h.hashtag_id
            JOIN posts p ON p.post_id = ph.post_id
            WHERE (:currentUserId IS NULL OR p.owner_id <> :currentUserId)
            AND (
                :currentUserId IS NULL
                OR NOT EXISTS (
                    SELECT 1 FROM user_blocks b
                    WHERE (b.blocker_id = :currentUserId AND b.blocked_id = p.owner_id)
                       OR (b.blocker_id = p.owner_id AND b.blocked_id = :currentUserId)
                )
            )
            AND (
                LOWER(h.name) LIKE LOWER(CONCAT('%', :q, '%'))
                OR h.name % :q
            )
            GROUP BY h.hashtag_id
            ORDER BY MAX(similarity(h.name, :q)) DESC, h.name ASC
            """,
            countQuery = """
            SELECT COUNT(DISTINCT h.hashtag_id)
            FROM hashtags h
            JOIN post_hashtags ph ON ph.hashtag_id = h.hashtag_id
            JOIN posts p ON p.post_id = ph.post_id
            WHERE (:currentUserId IS NULL OR p.owner_id <> :currentUserId)
            AND (
                :currentUserId IS NULL
                OR NOT EXISTS (
                    SELECT 1 FROM user_blocks b
                    WHERE (b.blocker_id = :currentUserId AND b.blocked_id = p.owner_id)
                       OR (b.blocker_id = p.owner_id AND b.blocked_id = :currentUserId)
                )
            )
            AND (
                LOWER(h.name) LIKE LOWER(CONCAT('%', :q, '%'))
                OR h.name % :q
            )
            """,
            nativeQuery = true
    )
    Page<Hashtag> searchHashtags(
            @Param("q") String q,
            @Param("currentUserId") Long currentUserId,
            Pageable pageable
    );
}

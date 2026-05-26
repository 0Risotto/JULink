package com.graduation.julink.post;

import com.graduation.julink.post.PostEntities.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface
PostRepository extends JpaRepository<Post, UUID> {

    Page<Post> findByOwner_IdOrderByCreatedAtDesc(Long ownerId, Pageable pageable);

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Post> findByOwner_IdInOrderByCreatedAtDesc(Collection<Long> ownerIds, Pageable pageable);

    long countByOwner_Id(Long ownerId);

    @Query("""
            SELECT p
            FROM Post p
            WHERE p.postId IN :postIds
            ORDER BY p.createdAt DESC
            """)
    Page<Post> findRecommendedPostsByIds(
            @Param("postIds") Collection<UUID> postIds,
            Pageable pageable
    );
}

interface PostAttachmentRepository extends JpaRepository<PostAttachment, UUID> {

    List<PostAttachment> findByPost_PostId(UUID postId);

    List<PostAttachment> findByPost_PostIdIn(Collection<UUID> postIds);

    void deleteByPost_PostId(UUID postId);
}

interface PostCountView {
    UUID getId();
    long getCount();
}

interface HashtagRepository extends JpaRepository<Hashtag, UUID> {

    Optional<Hashtag> findByName(String name);

    boolean existsByName(String name);

    @Query("""
            SELECT h
            FROM Hashtag h
            JOIN PostHashtag ph ON ph.hashtag = h
            GROUP BY h
            ORDER BY COUNT(ph.id) DESC
            """)
    Page<Hashtag> findTrendingHashtags(Pageable pageable);

    @Query("""
            SELECT COUNT(ph.id)
            FROM PostHashtag ph
            WHERE ph.hashtag.hashtagId = :hashtagId
            """)
    long countPostsByHashtagId(@Param("hashtagId") UUID hashtagId);
}

interface PostHashtagRepository extends JpaRepository<PostHashtag, UUID> {

    List<PostHashtag> findByPost_PostId(UUID postId);

    List<PostHashtag> findByPost_PostIdIn(Collection<UUID> postIds);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            DELETE FROM PostHashtag ph
            WHERE ph.post.postId = :postId
            """)
    void deleteByPost_PostId(@Param("postId") UUID postId);

    @Query("""
            SELECT ph.hashtag.name
            FROM PostHashtag ph
            WHERE ph.post.postId = :postId
            """)
    List<String> findHashtagNamesByPostId(@Param("postId") UUID postId);

    @Query("""
            SELECT ph.post
            FROM PostHashtag ph
            WHERE LOWER(ph.hashtag.name) = LOWER(:hashtagName)
            ORDER BY ph.post.createdAt DESC
            """)
    Page<Post> findPostsByHashtagName(
            @Param("hashtagName") String hashtagName,
            Pageable pageable
    );
}

interface PostLikeRepository extends JpaRepository<PostLike, UUID> {

    Optional<PostLike> findByPost_PostIdAndUser_Id(UUID postId, Long userId);

    boolean existsByPost_PostIdAndUser_Id(UUID postId, Long userId);

    long countByPost_PostId(UUID postId);

    void deleteByPost_PostIdAndUser_Id(UUID postId, Long userId);

    void deleteByPost_PostId(UUID postId);

    @Query("""
            SELECT l.post.postId AS id, COUNT(l.likeId) AS count
            FROM PostLike l
            WHERE l.post.postId IN :postIds
            GROUP BY l.post.postId
            """)
    List<PostCountView> countByPostIds(@Param("postIds") Collection<UUID> postIds);

    @Query("""
            SELECT l.post.postId
            FROM PostLike l
            WHERE l.user.id = :userId
            AND l.post.postId IN :postIds
            """)
    List<UUID> findLikedPostIdsByUserIdAndPostIds(
            @Param("userId") Long userId,
            @Param("postIds") Collection<UUID> postIds
    );
}

interface PostFavoriteRepository extends JpaRepository<PostFavorite, UUID> {

    Optional<PostFavorite> findByPost_PostIdAndUser_Id(UUID postId, Long userId);

    boolean existsByPost_PostIdAndUser_Id(UUID postId, Long userId);

    long countByPost_PostId(UUID postId);

    void deleteByPost_PostIdAndUser_Id(UUID postId, Long userId);

    void deleteByPost_PostId(UUID postId);

    @Query("""
            SELECT f.post
            FROM PostFavorite f
            WHERE f.user.id = :userId
            ORDER BY f.createdAt DESC
            """)
    Page<Post> findFavoritePostsByUserId(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            SELECT f.post.postId
            FROM PostFavorite f
            WHERE f.user.id = :userId
            AND f.post.postId IN :postIds
            """)
    List<UUID> findFavoritedPostIdsByUserIdAndPostIds(
            @Param("userId") Long userId,
            @Param("postIds") Collection<UUID> postIds
    );
}

interface PostCommentRepository extends JpaRepository<PostComment, UUID> {

    Page<PostComment> findByPost_PostIdAndParentCommentIsNullOrderByCreatedAtDesc(
            UUID postId,
            Pageable pageable
    );

    Page<PostComment> findByPost_PostIdAndParentCommentIsNullOrderByCreatedAtAsc(
            UUID postId,
            Pageable pageable
    );

    Page<PostComment> findByParentComment_CommentIdOrderByCreatedAtAsc(
            UUID parentCommentId,
            Pageable pageable
    );

    long countByPost_PostId(UUID postId);

    @Query("""
            SELECT c.post.postId AS id, COUNT(c.commentId) AS count
            FROM PostComment c
            WHERE c.post.postId IN :postIds
            GROUP BY c.post.postId
            """)
    List<PostCountView> countByPostIds(@Param("postIds") Collection<UUID> postIds);

    void deleteByPost_PostId(UUID postId);

    @Query("""
            SELECT c
            FROM PostComment c
            LEFT JOIN CommentLike cl ON cl.comment = c
            WHERE c.post.postId = :postId
            AND c.parentComment IS NULL
            GROUP BY c
            ORDER BY COUNT(cl.commentLikeId) DESC, c.createdAt DESC
            """)
    Page<PostComment> findTopLevelCommentsOrderByLikes(
            @Param("postId") UUID postId,
            Pageable pageable
    );
}

interface CommentLikeRepository extends JpaRepository<CommentLike, UUID> {

    Optional<CommentLike> findByComment_CommentIdAndUser_Id(UUID commentId, Long userId);

    boolean existsByComment_CommentIdAndUser_Id(UUID commentId, Long userId);

    long countByComment_CommentId(UUID commentId);

    void deleteByComment_CommentIdAndUser_Id(UUID commentId, Long userId);

    void deleteByComment_CommentId(UUID commentId);
}

interface PostImpressionRepository extends JpaRepository<PostImpression, UUID> {

    boolean existsByPost_PostIdAndUser_Id(UUID postId, Long userId);

    @Query("""
            SELECT i.post.postId
            FROM PostImpression i
            WHERE i.user.id = :userId
            AND i.post.postId IN :postIds
            """)
    List<UUID> findSeenPostIdsByUserIdAndPostIds(
            @Param("userId") Long userId,
            @Param("postIds") Collection<UUID> postIds
    );
}

use std::collections::HashMap;

use sqlx::{PgPool, Postgres, Transaction};
use uuid::Uuid;

use julink_common::AppError;
use julink_proto::Page;

use crate::{
    hashtags,
    models::{
        CommentResponse, CommentRow, CreateCommentRequest, FavoriteResponse, LikeResponse,
        MediaInput, MediaResponse, PostResponse, PostRow, TrendingHashtag,
    },
};

const POST_COLUMNS: &str = "p.id, p.author_id, p.author_username, p.body, \
                            p.like_count, p.comment_count, p.favorite_count, \
                            p.impression_count, p.created_at, p.updated_at";

const COMMENT_COLUMNS: &str = "c.id, c.post_id, c.author_id, c.author_username, c.body, \
                               c.parent_id, c.like_count, c.created_at, c.updated_at";

pub struct PostFilter<'a> {
    pub author: Option<&'a str>,
    pub hashtag: Option<&'a str>,
    pub favorites_of: Option<Uuid>,
}

#[derive(Debug, sqlx::FromRow)]
struct MediaRow {
    post_id: Uuid,
    kind: String,
    url: String,
    width: Option<i32>,
    height: Option<i32>,
    duration_seconds: Option<i32>,
    position: i32,
}

#[derive(Debug, sqlx::FromRow)]
struct TagRow {
    post_id: Uuid,
    name: String,
}

pub async fn list_posts(
    pool: &PgPool,
    viewer: Uuid,
    filter: PostFilter<'_>,
    cursor: Option<Uuid>,
    limit: u32,
) -> Result<Page<PostResponse>, AppError> {
    let rows = sqlx::query_as::<_, PostRow>(&format!(
        r#"
        SELECT {POST_COLUMNS},
            EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = $1) AS liked,
            EXISTS(SELECT 1 FROM post_favorites f WHERE f.post_id = p.id AND f.user_id = $1) AS favorited
        FROM posts p
        WHERE p.deleted_at IS NULL
          AND ($2::text IS NULL OR lower(p.author_username) = lower($2))
          AND ($3::text IS NULL OR EXISTS (
                SELECT 1 FROM post_hashtags ph
                JOIN hashtags h ON h.id = ph.hashtag_id
                WHERE ph.post_id = p.id AND h.name = $3
          ))
          AND ($4::uuid IS NULL OR EXISTS (
                SELECT 1 FROM post_favorites pf
                WHERE pf.post_id = p.id AND pf.user_id = $4
          ))
          AND ($5::uuid IS NULL OR (p.created_at, p.id) < (
                SELECT created_at, id FROM posts WHERE id = $5
          ))
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT $6
        "#
    ))
    .bind(viewer)
    .bind(filter.author.map(str::to_string))
    .bind(filter.hashtag.map(|tag| tag.to_lowercase()))
    .bind(filter.favorites_of)
    .bind(cursor)
    .bind(i64::from(limit) + 1)
    .fetch_all(pool)
    .await?;

    build_posts(pool, rows, limit).await
}

/// Internal read path used by the feed and search services.
pub async fn list_posts_by_authors(
    pool: &PgPool,
    viewer: Uuid,
    authors: Option<&[String]>,
    cursor: Option<Uuid>,
    limit: u32,
) -> Result<Page<PostResponse>, AppError> {
    let author_filter = authors.map(|authors| {
        authors
            .iter()
            .map(|author| author.trim().to_lowercase())
            .collect::<Vec<_>>()
    });

    let rows = sqlx::query_as::<_, PostRow>(&format!(
        r#"
        SELECT {POST_COLUMNS},
            EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = $1) AS liked,
            EXISTS(SELECT 1 FROM post_favorites f WHERE f.post_id = p.id AND f.user_id = $1) AS favorited
        FROM posts p
        WHERE p.deleted_at IS NULL
          AND ($2::text[] IS NULL OR lower(p.author_username) = ANY($2))
          AND ($3::uuid IS NULL OR (p.created_at, p.id) < (
                SELECT created_at, id FROM posts WHERE id = $3
          ))
        ORDER BY p.created_at DESC, p.id DESC
        LIMIT $4
        "#
    ))
    .bind(viewer)
    .bind(author_filter)
    .bind(cursor)
    .bind(i64::from(limit) + 1)
    .fetch_all(pool)
    .await?;

    build_posts(pool, rows, limit).await
}

pub async fn get_post(
    pool: &PgPool,
    viewer: Uuid,
    post_id: Uuid,
) -> Result<PostResponse, AppError> {
    let row = sqlx::query_as::<_, PostRow>(&format!(
        r#"
        SELECT {POST_COLUMNS},
            EXISTS(SELECT 1 FROM post_likes l WHERE l.post_id = p.id AND l.user_id = $1) AS liked,
            EXISTS(SELECT 1 FROM post_favorites f WHERE f.post_id = p.id AND f.user_id = $1) AS favorited
        FROM posts p
        WHERE p.id = $2 AND p.deleted_at IS NULL
        "#
    ))
    .bind(viewer)
    .bind(post_id)
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;

    let mut page = build_posts(pool, vec![row], 1).await?;
    page.items.pop().ok_or(AppError::NotFound)
}

pub async fn create_post(
    pool: &PgPool,
    author_id: Uuid,
    author_username: &str,
    body: &str,
    media: &[MediaInput],
) -> Result<PostResponse, AppError> {
    validate_post(body, media)?;
    let post_id = Uuid::now_v7();

    let mut tx = pool.begin().await?;
    sqlx::query("INSERT INTO posts (id, author_id, author_username, body) VALUES ($1, $2, $3, $4)")
        .bind(post_id)
        .bind(author_id)
        .bind(author_username)
        .bind(body)
        .execute(&mut *tx)
        .await?;

    insert_media(&mut tx, post_id, media).await?;
    sync_hashtags(&mut tx, post_id, body).await?;
    tx.commit().await?;

    get_post(pool, author_id, post_id).await
}

pub async fn update_post(
    pool: &PgPool,
    author_id: Uuid,
    post_id: Uuid,
    body: &str,
    media: &[MediaInput],
) -> Result<PostResponse, AppError> {
    validate_post(body, media)?;

    let mut tx = pool.begin().await?;
    let owner = sqlx::query_scalar::<_, Uuid>(
        "SELECT author_id FROM posts WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(post_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(AppError::NotFound)?;

    if owner != author_id {
        return Err(AppError::Forbidden);
    }

    sqlx::query("UPDATE posts SET body = $1, updated_at = now() WHERE id = $2")
        .bind(body)
        .bind(post_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("DELETE FROM post_media WHERE post_id = $1")
        .bind(post_id)
        .execute(&mut *tx)
        .await?;
    sqlx::query("DELETE FROM post_hashtags WHERE post_id = $1")
        .bind(post_id)
        .execute(&mut *tx)
        .await?;

    insert_media(&mut tx, post_id, media).await?;
    sync_hashtags(&mut tx, post_id, body).await?;
    tx.commit().await?;

    get_post(pool, author_id, post_id).await
}

pub async fn delete_post(pool: &PgPool, author_id: Uuid, post_id: Uuid) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;
    let owner = sqlx::query_scalar::<_, Uuid>(
        "SELECT author_id FROM posts WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(post_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(AppError::NotFound)?;

    if owner != author_id {
        return Err(AppError::Forbidden);
    }

    sqlx::query("DELETE FROM posts WHERE id = $1")
        .bind(post_id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    Ok(())
}

pub async fn toggle_post_like(
    pool: &PgPool,
    post_id: Uuid,
    user_id: Uuid,
) -> Result<LikeResponse, AppError> {
    let mut tx = pool.begin().await?;
    ensure_post(&mut tx, post_id).await?;

    let inserted = sqlx::query(
        "INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(post_id)
    .bind(user_id)
    .execute(&mut *tx)
    .await?
    .rows_affected()
        == 1;

    let like_count = if inserted {
        sqlx::query_scalar::<_, i32>(
            "UPDATE posts SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count",
        )
        .bind(post_id)
        .fetch_one(&mut *tx)
        .await?
    } else {
        sqlx::query("DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2")
            .bind(post_id)
            .bind(user_id)
            .execute(&mut *tx)
            .await?;
        sqlx::query_scalar::<_, i32>(
            "UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1 RETURNING like_count",
        )
        .bind(post_id)
        .fetch_one(&mut *tx)
        .await?
    };

    tx.commit().await?;
    Ok(LikeResponse {
        liked: inserted,
        like_count,
    })
}

pub async fn toggle_post_favorite(
    pool: &PgPool,
    post_id: Uuid,
    user_id: Uuid,
) -> Result<FavoriteResponse, AppError> {
    let mut tx = pool.begin().await?;
    ensure_post(&mut tx, post_id).await?;

    let inserted = sqlx::query(
        "INSERT INTO post_favorites (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(post_id)
    .bind(user_id)
    .execute(&mut *tx)
    .await?
    .rows_affected()
        == 1;

    let favorite_count = if inserted {
        sqlx::query_scalar::<_, i32>(
            "UPDATE posts SET favorite_count = favorite_count + 1 WHERE id = $1 RETURNING favorite_count",
        )
        .bind(post_id)
        .fetch_one(&mut *tx)
        .await?
    } else {
        sqlx::query("DELETE FROM post_favorites WHERE post_id = $1 AND user_id = $2")
            .bind(post_id)
            .bind(user_id)
            .execute(&mut *tx)
            .await?;
        sqlx::query_scalar::<_, i32>(
            "UPDATE posts SET favorite_count = GREATEST(favorite_count - 1, 0) WHERE id = $1 RETURNING favorite_count",
        )
        .bind(post_id)
        .fetch_one(&mut *tx)
        .await?
    };

    tx.commit().await?;
    Ok(FavoriteResponse {
        favorited: inserted,
        favorite_count,
    })
}

pub async fn set_post_favorite(
    pool: &PgPool,
    post_id: Uuid,
    user_id: Uuid,
    active: bool,
) -> Result<FavoriteResponse, AppError> {
    let mut tx = pool.begin().await?;
    ensure_post(&mut tx, post_id).await?;

    let changed = if active {
        sqlx::query(
            "INSERT INTO post_favorites (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(post_id)
        .bind(user_id)
        .execute(&mut *tx)
        .await?
        .rows_affected()
            == 1
    } else {
        sqlx::query("DELETE FROM post_favorites WHERE post_id = $1 AND user_id = $2")
            .bind(post_id)
            .bind(user_id)
            .execute(&mut *tx)
            .await?
            .rows_affected()
            == 1
    };

    if changed {
        let delta = if active { "+ 1" } else { "- 1" };
        sqlx::query(&format!(
            "UPDATE posts SET favorite_count = GREATEST(favorite_count {delta}, 0) WHERE id = $1"
        ))
        .bind(post_id)
        .execute(&mut *tx)
        .await?;
    }

    let favorite_count =
        sqlx::query_scalar::<_, i32>("SELECT favorite_count FROM posts WHERE id = $1")
            .bind(post_id)
            .fetch_one(&mut *tx)
            .await?;

    tx.commit().await?;
    Ok(FavoriteResponse {
        favorited: active,
        favorite_count,
    })
}

pub async fn record_impression(
    pool: &PgPool,
    post_id: Uuid,
    user_id: Uuid,
) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;
    ensure_post(&mut tx, post_id).await?;

    let inserted = sqlx::query(
        "INSERT INTO post_impressions (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(post_id)
    .bind(user_id)
    .execute(&mut *tx)
    .await?
    .rows_affected()
        == 1;

    if inserted {
        sqlx::query("UPDATE posts SET impression_count = impression_count + 1 WHERE id = $1")
            .bind(post_id)
            .execute(&mut *tx)
            .await?;
    }

    tx.commit().await?;
    Ok(())
}

pub async fn create_comment(
    pool: &PgPool,
    author_id: Uuid,
    author_username: &str,
    post_id: Uuid,
    request: &CreateCommentRequest,
) -> Result<CommentResponse, AppError> {
    validate_comment_body(&request.body)?;

    let mut tx = pool.begin().await?;
    ensure_post(&mut tx, post_id).await?;

    if let Some(parent_id) = request.parent_id {
        let parent_post: Option<Uuid> =
            sqlx::query_scalar("SELECT post_id FROM comments WHERE id = $1 AND deleted_at IS NULL")
                .bind(parent_id)
                .fetch_optional(&mut *tx)
                .await?;

        if parent_post != Some(post_id) {
            return Err(AppError::BadRequest(
                "parent comment does not belong to this post".to_string(),
            ));
        }
    }

    let comment_id = Uuid::now_v7();
    sqlx::query(
        r#"
        INSERT INTO comments (id, post_id, author_id, author_username, body, parent_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        "#,
    )
    .bind(comment_id)
    .bind(post_id)
    .bind(author_id)
    .bind(author_username)
    .bind(request.body.trim())
    .bind(request.parent_id)
    .execute(&mut *tx)
    .await?;

    sqlx::query("UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1")
        .bind(post_id)
        .execute(&mut *tx)
        .await?;

    tx.commit().await?;
    get_comment(pool, author_id, comment_id).await
}

pub async fn get_comment(
    pool: &PgPool,
    viewer: Uuid,
    comment_id: Uuid,
) -> Result<CommentResponse, AppError> {
    let row = sqlx::query_as::<_, CommentRow>(&format!(
        r#"
        SELECT {COMMENT_COLUMNS},
            EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $1) AS liked,
            (SELECT count(*) FROM comments r WHERE r.parent_id = c.id AND r.deleted_at IS NULL) AS reply_count
        FROM comments c
        WHERE c.id = $2 AND c.deleted_at IS NULL
        "#
    ))
    .bind(viewer)
    .bind(comment_id)
    .fetch_optional(pool)
    .await?
    .ok_or(AppError::NotFound)?;

    Ok(row.into())
}

pub async fn list_comments(
    pool: &PgPool,
    viewer: Uuid,
    post_id: Uuid,
    parent_id: Option<Uuid>,
    cursor: Option<Uuid>,
    limit: u32,
) -> Result<Page<CommentResponse>, AppError> {
    let mut rows = sqlx::query_as::<_, CommentRow>(&format!(
        r#"
        SELECT {COMMENT_COLUMNS},
            EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = $1) AS liked,
            (SELECT count(*) FROM comments r WHERE r.parent_id = c.id AND r.deleted_at IS NULL) AS reply_count
        FROM comments c
        WHERE c.post_id = $2
          AND c.deleted_at IS NULL
          AND (($3::uuid IS NULL AND c.parent_id IS NULL) OR c.parent_id = $3)
          AND ($4::uuid IS NULL OR (c.created_at, c.id) > (
                SELECT created_at, id FROM comments WHERE id = $4
          ))
        ORDER BY c.created_at ASC, c.id ASC
        LIMIT $5
        "#
    ))
    .bind(viewer)
    .bind(post_id)
    .bind(parent_id)
    .bind(cursor)
    .bind(i64::from(limit) + 1)
    .fetch_all(pool)
    .await?;

    let next_cursor = if rows.len() > limit as usize {
        rows.truncate(limit as usize);
        rows.last().map(|row| row.id.to_string())
    } else {
        None
    };

    Ok(Page {
        items: rows.into_iter().map(Into::into).collect(),
        next_cursor,
    })
}

pub async fn update_comment(
    pool: &PgPool,
    author_id: Uuid,
    comment_id: Uuid,
    body: &str,
) -> Result<CommentResponse, AppError> {
    validate_comment_body(body)?;

    let mut tx = pool.begin().await?;
    let owner = sqlx::query_scalar::<_, Uuid>(
        "SELECT author_id FROM comments WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(comment_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(AppError::NotFound)?;

    if owner != author_id {
        return Err(AppError::Forbidden);
    }

    sqlx::query("UPDATE comments SET body = $1, updated_at = now() WHERE id = $2")
        .bind(body.trim())
        .bind(comment_id)
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;

    get_comment(pool, author_id, comment_id).await
}

pub async fn delete_comment(
    pool: &PgPool,
    author_id: Uuid,
    comment_id: Uuid,
) -> Result<(), AppError> {
    let mut tx = pool.begin().await?;
    let row = sqlx::query_as::<_, (Uuid, Uuid)>(
        "SELECT post_id, author_id FROM comments WHERE id = $1 AND deleted_at IS NULL",
    )
    .bind(comment_id)
    .fetch_optional(&mut *tx)
    .await?
    .ok_or(AppError::NotFound)?;

    if row.1 != author_id {
        return Err(AppError::Forbidden);
    }

    sqlx::query("DELETE FROM comments WHERE id = $1")
        .bind(comment_id)
        .execute(&mut *tx)
        .await?;

    sqlx::query(
        "UPDATE posts SET comment_count = (SELECT count(*)::int FROM comments WHERE post_id = $1 AND deleted_at IS NULL) WHERE id = $1",
    )
    .bind(row.0)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

pub async fn toggle_comment_like(
    pool: &PgPool,
    comment_id: Uuid,
    user_id: Uuid,
) -> Result<LikeResponse, AppError> {
    let mut tx = pool.begin().await?;
    ensure_comment(&mut tx, comment_id).await?;

    let inserted = sqlx::query(
        "INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    )
    .bind(comment_id)
    .bind(user_id)
    .execute(&mut *tx)
    .await?
    .rows_affected()
        == 1;

    let like_count = if inserted {
        sqlx::query_scalar::<_, i32>(
            "UPDATE comments SET like_count = like_count + 1 WHERE id = $1 RETURNING like_count",
        )
        .bind(comment_id)
        .fetch_one(&mut *tx)
        .await?
    } else {
        sqlx::query("DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2")
            .bind(comment_id)
            .bind(user_id)
            .execute(&mut *tx)
            .await?;
        sqlx::query_scalar::<_, i32>(
            "UPDATE comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1 RETURNING like_count",
        )
        .bind(comment_id)
        .fetch_one(&mut *tx)
        .await?
    };

    tx.commit().await?;
    Ok(LikeResponse {
        liked: inserted,
        like_count,
    })
}

pub async fn set_comment_like(
    pool: &PgPool,
    comment_id: Uuid,
    user_id: Uuid,
    active: bool,
) -> Result<LikeResponse, AppError> {
    let mut tx = pool.begin().await?;
    ensure_comment(&mut tx, comment_id).await?;

    let changed = if active {
        sqlx::query(
            "INSERT INTO comment_likes (comment_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(comment_id)
        .bind(user_id)
        .execute(&mut *tx)
        .await?
        .rows_affected()
            == 1
    } else {
        sqlx::query("DELETE FROM comment_likes WHERE comment_id = $1 AND user_id = $2")
            .bind(comment_id)
            .bind(user_id)
            .execute(&mut *tx)
            .await?
            .rows_affected()
            == 1
    };

    if changed {
        let delta = if active { "+ 1" } else { "- 1" };
        sqlx::query(&format!(
            "UPDATE comments SET like_count = GREATEST(like_count {delta}, 0) WHERE id = $1"
        ))
        .bind(comment_id)
        .execute(&mut *tx)
        .await?;
    }

    let like_count = sqlx::query_scalar::<_, i32>("SELECT like_count FROM comments WHERE id = $1")
        .bind(comment_id)
        .fetch_one(&mut *tx)
        .await?;

    tx.commit().await?;
    Ok(LikeResponse {
        liked: active,
        like_count,
    })
}

pub async fn trending_hashtags(
    pool: &PgPool,
    limit: u32,
) -> Result<Vec<TrendingHashtag>, AppError> {
    let rows = sqlx::query_as::<_, TrendingHashtag>(
        r#"
        SELECT h.name, count(*)::bigint AS post_count
        FROM post_hashtags ph
        JOIN hashtags h ON h.id = ph.hashtag_id
        JOIN posts p ON p.id = ph.post_id
        WHERE p.deleted_at IS NULL
          AND p.created_at > now() - interval '7 days'
        GROUP BY h.name
        ORDER BY post_count DESC, h.name
        LIMIT $1
        "#,
    )
    .bind(i64::from(limit))
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

async fn build_posts(
    pool: &PgPool,
    mut rows: Vec<PostRow>,
    limit: u32,
) -> Result<Page<PostResponse>, AppError> {
    let next_cursor = if rows.len() > limit as usize {
        rows.truncate(limit as usize);
        rows.last().map(|row| row.id.to_string())
    } else {
        None
    };

    let ids: Vec<Uuid> = rows.iter().map(|row| row.id).collect();
    let mut media = load_media(pool, &ids).await?;
    let mut tags = load_tags(pool, &ids).await?;

    let items = rows
        .into_iter()
        .map(|row| PostResponse {
            id: row.id,
            author_id: row.author_id,
            author_username: row.author_username,
            body: row.body,
            media: media.remove(&row.id).unwrap_or_default(),
            hashtags: tags.remove(&row.id).unwrap_or_default(),
            like_count: row.like_count,
            comment_count: row.comment_count,
            favorite_count: row.favorite_count,
            impression_count: row.impression_count,
            liked: row.liked,
            favorited: row.favorited,
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
        .collect();

    Ok(Page { items, next_cursor })
}

async fn load_media(
    pool: &PgPool,
    ids: &[Uuid],
) -> Result<HashMap<Uuid, Vec<MediaResponse>>, AppError> {
    if ids.is_empty() {
        return Ok(HashMap::new());
    }

    let rows = sqlx::query_as::<_, MediaRow>(
        r#"
        SELECT post_id, kind, url, width, height, duration_seconds, position
        FROM post_media
        WHERE post_id = ANY($1)
        ORDER BY post_id, position
        "#,
    )
    .bind(ids)
    .fetch_all(pool)
    .await?;

    let mut grouped: HashMap<Uuid, Vec<MediaResponse>> = HashMap::new();
    for row in rows {
        grouped.entry(row.post_id).or_default().push(MediaResponse {
            kind: row.kind,
            url: row.url,
            width: row.width,
            height: row.height,
            duration_seconds: row.duration_seconds,
            position: row.position,
        });
    }

    Ok(grouped)
}

async fn load_tags(pool: &PgPool, ids: &[Uuid]) -> Result<HashMap<Uuid, Vec<String>>, AppError> {
    if ids.is_empty() {
        return Ok(HashMap::new());
    }

    let rows = sqlx::query_as::<_, TagRow>(
        r#"
        SELECT ph.post_id, h.name
        FROM post_hashtags ph
        JOIN hashtags h ON h.id = ph.hashtag_id
        WHERE ph.post_id = ANY($1)
        ORDER BY ph.post_id, h.name
        "#,
    )
    .bind(ids)
    .fetch_all(pool)
    .await?;

    let mut grouped: HashMap<Uuid, Vec<String>> = HashMap::new();
    for row in rows {
        grouped.entry(row.post_id).or_default().push(row.name);
    }

    Ok(grouped)
}

async fn insert_media(
    tx: &mut Transaction<'_, Postgres>,
    post_id: Uuid,
    media: &[MediaInput],
) -> Result<(), AppError> {
    for (position, item) in media.iter().enumerate() {
        validate_media(item)?;
        sqlx::query(
            r#"
            INSERT INTO post_media
                (post_id, kind, url, width, height, duration_seconds, position)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
        )
        .bind(post_id)
        .bind(&item.kind)
        .bind(&item.url)
        .bind(item.width)
        .bind(item.height)
        .bind(item.duration_seconds)
        .bind(position as i32)
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}

async fn sync_hashtags(
    tx: &mut Transaction<'_, Postgres>,
    post_id: Uuid,
    body: &str,
) -> Result<(), AppError> {
    for tag in hashtags::extract(body) {
        let hashtag_id = sqlx::query_scalar::<_, Uuid>(
            r#"
            INSERT INTO hashtags (name) VALUES ($1)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
            "#,
        )
        .bind(&tag)
        .fetch_one(&mut **tx)
        .await?;

        sqlx::query(
            "INSERT INTO post_hashtags (post_id, hashtag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        )
        .bind(post_id)
        .bind(hashtag_id)
        .execute(&mut **tx)
        .await?;
    }

    Ok(())
}

async fn ensure_post(tx: &mut Transaction<'_, Postgres>, post_id: Uuid) -> Result<(), AppError> {
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM posts WHERE id = $1 AND deleted_at IS NULL)",
    )
    .bind(post_id)
    .fetch_one(&mut **tx)
    .await?;

    if exists {
        Ok(())
    } else {
        Err(AppError::NotFound)
    }
}

async fn ensure_comment(
    tx: &mut Transaction<'_, Postgres>,
    comment_id: Uuid,
) -> Result<(), AppError> {
    let exists = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM comments WHERE id = $1 AND deleted_at IS NULL)",
    )
    .bind(comment_id)
    .fetch_one(&mut **tx)
    .await?;

    if exists {
        Ok(())
    } else {
        Err(AppError::NotFound)
    }
}

fn validate_post(body: &str, media: &[MediaInput]) -> Result<(), AppError> {
    if body.chars().count() > 5000 {
        return Err(AppError::BadRequest(
            "post body must be at most 5000 characters".to_string(),
        ));
    }
    if body.trim().is_empty() && media.is_empty() {
        return Err(AppError::BadRequest(
            "post must contain text or media".to_string(),
        ));
    }
    if media.len() > 10 {
        return Err(AppError::BadRequest(
            "a post may contain at most 10 media items".to_string(),
        ));
    }
    for item in media {
        validate_media(item)?;
    }
    Ok(())
}

fn validate_media(item: &MediaInput) -> Result<(), AppError> {
    if !matches!(item.kind.as_str(), "image" | "video" | "file") {
        return Err(AppError::BadRequest(
            "media kind must be `image`, `video` or `file`".to_string(),
        ));
    }
    let url = item.url.trim();
    if url.is_empty() || url.len() > 2048 {
        return Err(AppError::BadRequest("invalid media url".to_string()));
    }
    if !(url.starts_with("http://") || url.starts_with("https://") || url.starts_with('/')) {
        return Err(AppError::BadRequest(
            "media url must be absolute or start with `/`".to_string(),
        ));
    }
    Ok(())
}

fn validate_comment_body(body: &str) -> Result<(), AppError> {
    let length = body.trim().chars().count();
    if !(1..=2000).contains(&length) {
        return Err(AppError::BadRequest(
            "comment must be 1-2000 characters".to_string(),
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_posts_and_media() {
        assert!(validate_post("hello", &[]).is_ok());
        assert!(validate_post("", &[]).is_err());
        assert!(
            validate_post(
                "",
                &[MediaInput {
                    kind: "image".to_string(),
                    url: "https://example.com/a.png".to_string(),
                    width: None,
                    height: None,
                    duration_seconds: None,
                }]
            )
            .is_ok()
        );
        assert!(
            validate_post(
                "hello",
                &[MediaInput {
                    kind: "audio".to_string(),
                    url: "https://example.com/a.mp3".to_string(),
                    width: None,
                    height: None,
                    duration_seconds: None,
                }]
            )
            .is_err()
        );
    }

    #[test]
    fn validates_comments() {
        assert!(validate_comment_body("hello").is_ok());
        assert!(validate_comment_body("   ").is_err());
    }
}

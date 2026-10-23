use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
};
use serde::Deserialize;
use uuid::Uuid;

use julink_common::{AppError, auth::CurrentUser, pagination::PageQuery};
use julink_proto::Page;

use crate::{
    models::{
        CommentResponse, CreateCommentRequest, CreatePostRequest, FavoriteResponse, LikeResponse,
        PostResponse, TrendingHashtag, UpdateCommentRequest, UpdatePostRequest,
    },
    repo::{self, PostFilter},
    state::ContentState,
};

pub fn router(state: ContentState) -> Router {
    Router::new()
        .route("/internal/posts/feed", post(internal_feed))
        .route("/internal/posts", get(internal_posts))
        .route("/api/v1/posts", post(create_post))
        .route("/api/v1/posts/favorites", get(favorite_posts))
        .route("/api/v1/posts/hashtags/trending", get(trending_hashtags))
        .route("/api/v1/posts/hashtags/{name}", get(hashtag_posts))
        .route("/api/v1/posts/user/{username}", get(user_posts))
        .route(
            "/api/v1/posts/comments/{comment_id}/replies",
            get(list_replies),
        )
        .route(
            "/api/v1/posts/comments/{comment_id}",
            axum::routing::put(update_comment).delete(delete_comment),
        )
        .route(
            "/api/v1/posts/comments/{comment_id}/toggle-like",
            post(toggle_comment_like),
        )
        .route(
            "/api/v1/posts/comments/{comment_id}/like",
            post(like_comment).delete(unlike_comment),
        )
        .route(
            "/api/v1/posts/{post_id}",
            get(get_post).put(update_post).delete(delete_post),
        )
        .route(
            "/api/v1/posts/{post_id}/toggle-like",
            post(toggle_post_like),
        )
        .route(
            "/api/v1/posts/{post_id}/toggle-favorite",
            post(toggle_post_favorite),
        )
        .route(
            "/api/v1/posts/{post_id}/favorite",
            post(favorite_post).delete(unfavorite_post),
        )
        .route(
            "/api/v1/posts/{post_id}/comments",
            get(list_comments).post(create_comment),
        )
        .route(
            "/api/v1/posts/{post_id}/impression",
            post(record_impression),
        )
        .with_state(state)
}

async fn create_post(
    State(state): State<ContentState>,
    user: CurrentUser,
    Json(request): Json<CreatePostRequest>,
) -> Result<(StatusCode, Json<PostResponse>), AppError> {
    let post = repo::create_post(
        &state.db,
        user.user_id,
        &user.username,
        &request.body,
        &request.media,
    )
    .await?;
    Ok((StatusCode::CREATED, Json(post)))
}

#[derive(Debug, Deserialize)]
struct InternalFeedRequest {
    author_usernames: Option<Vec<String>>,
    viewer_id: Option<Uuid>,
    cursor: Option<Uuid>,
    limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
struct InternalPostsQuery {
    cursor: Option<Uuid>,
    limit: Option<u32>,
}

async fn internal_feed(
    State(state): State<ContentState>,
    Json(request): Json<InternalFeedRequest>,
) -> Result<Json<Page<PostResponse>>, AppError> {
    let limit = request.limit.unwrap_or(20).clamp(1, 1000);
    Ok(Json(
        repo::list_posts_by_authors(
            &state.db,
            request.viewer_id.unwrap_or(Uuid::nil()),
            request.author_usernames.as_deref(),
            request.cursor,
            limit,
        )
        .await?,
    ))
}

async fn internal_posts(
    State(state): State<ContentState>,
    Query(query): Query<InternalPostsQuery>,
) -> Result<Json<Page<PostResponse>>, AppError> {
    let limit = query.limit.unwrap_or(500).clamp(1, 1000);
    Ok(Json(
        repo::list_posts_by_authors(&state.db, Uuid::nil(), None, query.cursor, limit).await?,
    ))
}

async fn get_post(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(post_id): Path<Uuid>,
) -> Result<Json<PostResponse>, AppError> {
    Ok(Json(
        repo::get_post(&state.db, user.user_id, post_id).await?,
    ))
}

async fn update_post(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(post_id): Path<Uuid>,
    Json(request): Json<UpdatePostRequest>,
) -> Result<Json<PostResponse>, AppError> {
    Ok(Json(
        repo::update_post(
            &state.db,
            user.user_id,
            post_id,
            &request.body,
            &request.media,
        )
        .await?,
    ))
}

async fn delete_post(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(post_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    repo::delete_post(&state.db, user.user_id, post_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn user_posts(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(username): Path<String>,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<PostResponse>>, AppError> {
    let cursor = parse_cursor(&query)?;
    Ok(Json(
        repo::list_posts(
            &state.db,
            user.user_id,
            PostFilter {
                author: Some(username.trim()),
                hashtag: None,
                favorites_of: None,
            },
            cursor,
            query.limit(),
        )
        .await?,
    ))
}

async fn favorite_posts(
    State(state): State<ContentState>,
    user: CurrentUser,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<PostResponse>>, AppError> {
    let cursor = parse_cursor(&query)?;
    Ok(Json(
        repo::list_posts(
            &state.db,
            user.user_id,
            PostFilter {
                author: None,
                hashtag: None,
                favorites_of: Some(user.user_id),
            },
            cursor,
            query.limit(),
        )
        .await?,
    ))
}

async fn hashtag_posts(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(name): Path<String>,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<PostResponse>>, AppError> {
    let cursor = parse_cursor(&query)?;
    Ok(Json(
        repo::list_posts(
            &state.db,
            user.user_id,
            PostFilter {
                author: None,
                hashtag: Some(name.trim()),
                favorites_of: None,
            },
            cursor,
            query.limit(),
        )
        .await?,
    ))
}

async fn trending_hashtags(
    State(state): State<ContentState>,
    Query(query): Query<PageQuery>,
) -> Result<Json<Vec<TrendingHashtag>>, AppError> {
    Ok(Json(
        repo::trending_hashtags(&state.db, query.limit()).await?,
    ))
}

async fn toggle_post_like(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(post_id): Path<Uuid>,
) -> Result<Json<LikeResponse>, AppError> {
    Ok(Json(
        repo::toggle_post_like(&state.db, post_id, user.user_id).await?,
    ))
}

async fn toggle_post_favorite(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(post_id): Path<Uuid>,
) -> Result<Json<FavoriteResponse>, AppError> {
    Ok(Json(
        repo::toggle_post_favorite(&state.db, post_id, user.user_id).await?,
    ))
}

async fn favorite_post(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(post_id): Path<Uuid>,
) -> Result<Json<FavoriteResponse>, AppError> {
    Ok(Json(
        repo::set_post_favorite(&state.db, post_id, user.user_id, true).await?,
    ))
}

async fn unfavorite_post(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(post_id): Path<Uuid>,
) -> Result<Json<FavoriteResponse>, AppError> {
    Ok(Json(
        repo::set_post_favorite(&state.db, post_id, user.user_id, false).await?,
    ))
}

async fn record_impression(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(post_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    repo::record_impression(&state.db, post_id, user.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn create_comment(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(post_id): Path<Uuid>,
    Json(request): Json<CreateCommentRequest>,
) -> Result<(StatusCode, Json<CommentResponse>), AppError> {
    let comment =
        repo::create_comment(&state.db, user.user_id, &user.username, post_id, &request).await?;
    Ok((StatusCode::CREATED, Json(comment)))
}

async fn list_comments(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(post_id): Path<Uuid>,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<CommentResponse>>, AppError> {
    let cursor = parse_cursor(&query)?;
    Ok(Json(
        repo::list_comments(
            &state.db,
            user.user_id,
            post_id,
            None,
            cursor,
            query.limit(),
        )
        .await?,
    ))
}

async fn list_replies(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(comment_id): Path<Uuid>,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<CommentResponse>>, AppError> {
    let cursor = parse_cursor(&query)?;
    let comment = repo::get_comment(&state.db, user.user_id, comment_id).await?;
    Ok(Json(
        repo::list_comments(
            &state.db,
            user.user_id,
            comment.post_id,
            Some(comment_id),
            cursor,
            query.limit(),
        )
        .await?,
    ))
}

async fn update_comment(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(comment_id): Path<Uuid>,
    Json(request): Json<UpdateCommentRequest>,
) -> Result<Json<CommentResponse>, AppError> {
    Ok(Json(
        repo::update_comment(&state.db, user.user_id, comment_id, &request.body).await?,
    ))
}

async fn delete_comment(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(comment_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    repo::delete_comment(&state.db, user.user_id, comment_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn toggle_comment_like(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(comment_id): Path<Uuid>,
) -> Result<Json<LikeResponse>, AppError> {
    Ok(Json(
        repo::toggle_comment_like(&state.db, comment_id, user.user_id).await?,
    ))
}

async fn like_comment(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(comment_id): Path<Uuid>,
) -> Result<Json<LikeResponse>, AppError> {
    Ok(Json(
        repo::set_comment_like(&state.db, comment_id, user.user_id, true).await?,
    ))
}

async fn unlike_comment(
    State(state): State<ContentState>,
    user: CurrentUser,
    Path(comment_id): Path<Uuid>,
) -> Result<Json<LikeResponse>, AppError> {
    Ok(Json(
        repo::set_comment_like(&state.db, comment_id, user.user_id, false).await?,
    ))
}

fn parse_cursor(query: &PageQuery) -> Result<Option<Uuid>, AppError> {
    match query.cursor.as_deref() {
        Some(value) if !value.is_empty() => Uuid::parse_str(value)
            .map(Some)
            .map_err(|_| AppError::BadRequest("invalid cursor".to_string())),
        _ => Ok(None),
    }
}

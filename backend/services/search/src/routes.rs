use axum::{
    Json, Router,
    extract::{Query, State},
    http::StatusCode,
    routing::{get, post},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use julink_common::AppError;
use julink_proto::UserSummary;

use crate::{state::SearchState, sync};

#[derive(Debug, Deserialize)]
struct SearchQuery {
    q: Option<String>,
    limit: Option<u32>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
struct SearchUserRow {
    id: Uuid,
    username: String,
    display_name: String,
    avatar_url: Option<String>,
}

impl From<SearchUserRow> for UserSummary {
    fn from(row: SearchUserRow) -> Self {
        Self {
            id: row.id,
            username: row.username,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
        }
    }
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
struct SearchPostRow {
    id: Uuid,
    author_id: Uuid,
    author_username: String,
    body: String,
    hashtags: Vec<String>,
    created_at: DateTime<Utc>,
    snippet: String,
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
struct HashtagResult {
    hashtag: String,
    post_count: i64,
}

#[derive(Debug, Serialize)]
struct SearchResponse {
    users: Vec<UserSummary>,
    posts: Vec<SearchPostRow>,
    hashtags: Vec<HashtagResult>,
}

pub fn router(state: SearchState) -> Router {
    Router::new()
        .route("/api/v1/search", get(search_all))
        .route("/api/v1/search/users", get(search_users))
        .route("/api/v1/search/posts", get(search_posts))
        .route("/api/v1/search/hashtags", get(search_hashtags))
        .route("/internal/search/reindex", post(reindex))
        .with_state(state)
}

async fn search_all(
    State(state): State<SearchState>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<SearchResponse>, AppError> {
    let (term, limit) = normalize(query)?;

    Ok(Json(SearchResponse {
        users: query_users(&state.db, &term, limit).await?,
        posts: query_posts(&state.db, &term, limit).await?,
        hashtags: query_hashtags(&state.db, &term, limit).await?,
    }))
}

async fn search_users(
    State(state): State<SearchState>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<Vec<UserSummary>>, AppError> {
    let (term, limit) = normalize(query)?;
    Ok(Json(query_users(&state.db, &term, limit).await?))
}

async fn search_posts(
    State(state): State<SearchState>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<Vec<SearchPostRow>>, AppError> {
    let (term, limit) = normalize(query)?;
    Ok(Json(query_posts(&state.db, &term, limit).await?))
}

async fn search_hashtags(
    State(state): State<SearchState>,
    Query(query): Query<SearchQuery>,
) -> Result<Json<Vec<HashtagResult>>, AppError> {
    let (term, limit) = normalize(query)?;
    Ok(Json(query_hashtags(&state.db, &term, limit).await?))
}

async fn reindex(State(state): State<SearchState>) -> Result<StatusCode, AppError> {
    sync::sync_once(&state).await.map_err(AppError::Internal)?;
    Ok(StatusCode::NO_CONTENT)
}

fn normalize(query: SearchQuery) -> Result<(String, i64), AppError> {
    let term = query.q.unwrap_or_default().trim().to_string();
    if term.is_empty() {
        return Err(AppError::BadRequest("search query is required".to_string()));
    }
    if term.chars().count() > 100 {
        return Err(AppError::BadRequest(
            "search query must be at most 100 characters".to_string(),
        ));
    }

    let limit = i64::from(query.limit.unwrap_or(20).clamp(1, 50));
    Ok((term, limit))
}

async fn query_users(pool: &PgPool, term: &str, limit: i64) -> Result<Vec<UserSummary>, AppError> {
    let rows = sqlx::query_as::<_, SearchUserRow>(
        r#"
        WITH query AS (SELECT websearch_to_tsquery('simple', $1) AS q)
        SELECT u.id, u.username, u.display_name, u.avatar_url
        FROM search_users u, query
        WHERE u.search_vector @@ query.q
        ORDER BY ts_rank(u.search_vector, query.q) DESC, u.username
        LIMIT $2
        "#,
    )
    .bind(term)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(Into::into).collect())
}

async fn query_posts(
    pool: &PgPool,
    term: &str,
    limit: i64,
) -> Result<Vec<SearchPostRow>, AppError> {
    let rows = sqlx::query_as::<_, SearchPostRow>(
        r#"
        WITH query AS (SELECT websearch_to_tsquery('simple', $1) AS q)
        SELECT p.id, p.author_id, p.author_username, p.body, p.hashtags, p.created_at,
               ts_headline(
                   'simple', p.body, query.q,
                   'StartSel=<mark>,StopSel=</mark>,MaxWords=30,MinWords=5'
               ) AS snippet
        FROM search_posts p, query
        WHERE p.search_vector @@ query.q
        ORDER BY ts_rank(p.search_vector, query.q) DESC, p.created_at DESC
        LIMIT $2
        "#,
    )
    .bind(term)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

async fn query_hashtags(
    pool: &PgPool,
    term: &str,
    limit: i64,
) -> Result<Vec<HashtagResult>, AppError> {
    let rows = sqlx::query_as::<_, HashtagResult>(
        r#"
        SELECT h.name AS hashtag, count(*)::bigint AS post_count
        FROM search_posts, unnest(hashtags) AS h(name)
        WHERE h.name ILIKE '%' || $1 || '%'
        GROUP BY h.name
        ORDER BY post_count DESC, h.name
        LIMIT $2
        "#,
    )
    .bind(term.to_lowercase())
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows)
}

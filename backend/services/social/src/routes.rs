use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
};
use julink_common::{AppError, auth::CurrentUser, pagination::PageQuery};
use julink_proto::Page;

use crate::{
    events,
    graph::{self, BlockStatus, FollowUser, FollowingStatus, MutualStatus, Suggestion},
    identity::InternalUser,
    state::SocialState,
};

pub fn router(state: SocialState) -> Router {
    Router::new()
        .route("/api/v1/follow/ping", get(ping))
        .route(
            "/internal/follow/{username}/followings",
            get(internal_followings),
        )
        .route("/api/v1/follow/friends", get(friends))
        .route("/api/v1/follow/suggestion", get(suggestions))
        .route(
            "/api/v1/follow/mutual-followings/{other}",
            get(mutual_followings),
        )
        .route(
            "/api/v1/follow/mutual-followers/{other}",
            get(mutual_followers),
        )
        .route("/api/v1/follow/{username}", post(follow).delete(unfollow))
        .route("/api/v1/follow/{username}/followers", get(followers))
        .route("/api/v1/follow/{username}/followings", get(followings))
        .route("/api/v1/follow/{username}/is-following", get(is_following))
        .route("/api/v1/follow/{username}/mutual", get(mutual))
        .route("/api/v1/blocks", get(blocks))
        .route("/api/v1/blocks/{username}", post(block).delete(unblock))
        .route("/api/v1/blocks/{username}/status", get(block_status))
        .with_state(state)
}

async fn ping() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "service": "social", "status": "ok" }))
}

async fn internal_followings(
    State(state): State<SocialState>,
    Path(username): Path<String>,
) -> Result<Json<Vec<String>>, AppError> {
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::all_followings(&graph, username.trim(), 1000).await?,
    ))
}

async fn follow(
    State(state): State<SocialState>,
    user: CurrentUser,
    Path(username): Path<String>,
) -> Result<StatusCode, AppError> {
    let target = resolve_target(&state, &user, &username).await?;
    let graph = state.require_graph()?.clone();

    graph::ensure_user(&graph, user.user_id, &user.username).await?;
    graph::ensure_user(&graph, target.user_id, &target.username).await?;
    graph::follow(&graph, &user.username, &target.username).await?;
    events::record_graph_event(
        state.db.as_ref(),
        events::FOLLOW_CREATED,
        user.user_id,
        &user.username,
        target.user_id,
        &target.username,
    )
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn unfollow(
    State(state): State<SocialState>,
    user: CurrentUser,
    Path(username): Path<String>,
) -> Result<StatusCode, AppError> {
    let target = resolve_target(&state, &user, &username).await?;
    let graph = state.require_graph()?.clone();

    graph::ensure_user(&graph, user.user_id, &user.username).await?;
    graph::ensure_user(&graph, target.user_id, &target.username).await?;
    graph::unfollow(&graph, &user.username, &target.username).await?;
    events::record_graph_event(
        state.db.as_ref(),
        events::FOLLOW_DELETED,
        user.user_id,
        &user.username,
        target.user_id,
        &target.username,
    )
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn followers(
    State(state): State<SocialState>,
    Path(username): Path<String>,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<FollowUser>>, AppError> {
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::followers(
            &graph,
            username.trim(),
            query.cursor.as_deref(),
            query.limit(),
        )
        .await?,
    ))
}

async fn followings(
    State(state): State<SocialState>,
    Path(username): Path<String>,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<FollowUser>>, AppError> {
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::followings(
            &graph,
            username.trim(),
            query.cursor.as_deref(),
            query.limit(),
        )
        .await?,
    ))
}

async fn friends(
    State(state): State<SocialState>,
    user: CurrentUser,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<FollowUser>>, AppError> {
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::friends(
            &graph,
            &user.username,
            query.cursor.as_deref(),
            query.limit(),
        )
        .await?,
    ))
}

async fn is_following(
    State(state): State<SocialState>,
    user: CurrentUser,
    Path(username): Path<String>,
) -> Result<Json<FollowingStatus>, AppError> {
    let target = resolve_target(&state, &user, &username).await?;
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::is_following(&graph, &user.username, &target.username).await?,
    ))
}

async fn mutual(
    State(state): State<SocialState>,
    user: CurrentUser,
    Path(username): Path<String>,
) -> Result<Json<MutualStatus>, AppError> {
    let target = resolve_target(&state, &user, &username).await?;
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::is_mutual(&graph, &user.username, &target.username).await?,
    ))
}

async fn mutual_followings(
    State(state): State<SocialState>,
    user: CurrentUser,
    Path(other): Path<String>,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<FollowUser>>, AppError> {
    let target = resolve_target(&state, &user, &other).await?;
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::mutual_followings(
            &graph,
            &user.username,
            &target.username,
            query.cursor.as_deref(),
            query.limit(),
        )
        .await?,
    ))
}

async fn mutual_followers(
    State(state): State<SocialState>,
    user: CurrentUser,
    Path(other): Path<String>,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<FollowUser>>, AppError> {
    let target = resolve_target(&state, &user, &other).await?;
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::mutual_followers(
            &graph,
            &user.username,
            &target.username,
            query.cursor.as_deref(),
            query.limit(),
        )
        .await?,
    ))
}

async fn suggestions(
    State(state): State<SocialState>,
    user: CurrentUser,
    Query(query): Query<PageQuery>,
) -> Result<Json<Vec<Suggestion>>, AppError> {
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::suggestions(&graph, &user.username, query.limit()).await?,
    ))
}

async fn block(
    State(state): State<SocialState>,
    user: CurrentUser,
    Path(username): Path<String>,
) -> Result<StatusCode, AppError> {
    let target = resolve_target(&state, &user, &username).await?;
    let graph = state.require_graph()?.clone();

    graph::ensure_user(&graph, user.user_id, &user.username).await?;
    graph::ensure_user(&graph, target.user_id, &target.username).await?;
    graph::block(&graph, &user.username, &target.username).await?;
    events::record_graph_event(
        state.db.as_ref(),
        events::BLOCK_CREATED,
        user.user_id,
        &user.username,
        target.user_id,
        &target.username,
    )
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn unblock(
    State(state): State<SocialState>,
    user: CurrentUser,
    Path(username): Path<String>,
) -> Result<StatusCode, AppError> {
    let target = resolve_target(&state, &user, &username).await?;
    let graph = state.require_graph()?.clone();

    graph::unblock(&graph, &user.username, &target.username).await?;
    events::record_graph_event(
        state.db.as_ref(),
        events::BLOCK_DELETED,
        user.user_id,
        &user.username,
        target.user_id,
        &target.username,
    )
    .await?;

    Ok(StatusCode::NO_CONTENT)
}

async fn blocks(
    State(state): State<SocialState>,
    user: CurrentUser,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<FollowUser>>, AppError> {
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::blocked_users(
            &graph,
            &user.username,
            query.cursor.as_deref(),
            query.limit(),
        )
        .await?,
    ))
}

async fn block_status(
    State(state): State<SocialState>,
    user: CurrentUser,
    Path(username): Path<String>,
) -> Result<Json<BlockStatus>, AppError> {
    let target = resolve_target(&state, &user, &username).await?;
    let graph = state.require_graph()?.clone();
    Ok(Json(
        graph::block_status(&graph, &user.username, &target.username).await?,
    ))
}

async fn resolve_target(
    state: &SocialState,
    user: &CurrentUser,
    username: &str,
) -> Result<InternalUser, AppError> {
    let username = username.trim();
    if username.is_empty() {
        return Err(AppError::BadRequest("username is required".to_string()));
    }
    if username.eq_ignore_ascii_case(&user.username) {
        return Err(AppError::BadRequest(
            "you cannot target yourself".to_string(),
        ));
    }

    state.identity.user_by_username(username).await
}

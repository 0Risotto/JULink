use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, patch},
};
use serde_json::json;
use uuid::Uuid;

use julink_common::{AppError, auth::CurrentUser, pagination::PageQuery};
use julink_proto::Page;

use crate::{models::NotificationView, repo, state::NotificationsState};

pub fn router(state: NotificationsState) -> Router {
    Router::new()
        .route("/api/v1/notifications/ping", get(ping))
        .route("/api/v1/notifications", get(list))
        .route("/api/v1/notifications/unread-count", get(unread_count))
        .route("/api/v1/notifications/read-all", patch(mark_all_read))
        .route(
            "/api/v1/notifications/{notification_id}/read",
            patch(mark_read),
        )
        .route(
            "/api/v1/notifications/{notification_id}",
            axum::routing::delete(delete),
        )
        .with_state(state)
}

async fn ping() -> Json<serde_json::Value> {
    Json(json!({ "service": "notifications", "status": "ok" }))
}

async fn list(
    State(state): State<NotificationsState>,
    user: CurrentUser,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<NotificationView>>, AppError> {
    let cursor = parse_cursor(&query)?;
    Ok(Json(
        repo::list(&state.db, user.user_id, cursor, query.limit()).await?,
    ))
}

async fn unread_count(
    State(state): State<NotificationsState>,
    user: CurrentUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let count = repo::unread_count(&state.db, user.user_id).await?;
    Ok(Json(json!({ "unreadCount": count })))
}

async fn mark_read(
    State(state): State<NotificationsState>,
    user: CurrentUser,
    Path(notification_id): Path<Uuid>,
) -> Result<Json<NotificationView>, AppError> {
    Ok(Json(
        repo::mark_read(&state.db, notification_id, user.user_id).await?,
    ))
}

async fn mark_all_read(
    State(state): State<NotificationsState>,
    user: CurrentUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let updated = repo::mark_all_read(&state.db, user.user_id).await?;
    Ok(Json(
        json!({ "status": "success", "updatedCount": updated }),
    ))
}

async fn delete(
    State(state): State<NotificationsState>,
    user: CurrentUser,
    Path(notification_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    repo::delete(&state.db, notification_id, user.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

fn parse_cursor(query: &PageQuery) -> Result<Option<Uuid>, AppError> {
    match query.cursor.as_deref() {
        Some(value) if !value.is_empty() => Uuid::parse_str(value)
            .map(Some)
            .map_err(|_| AppError::BadRequest("invalid cursor".to_string())),
        _ => Ok(None),
    }
}

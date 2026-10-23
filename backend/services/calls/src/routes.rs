use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
};
use serde_json::json;
use uuid::Uuid;

use julink_common::{AppError, auth::CurrentUser, pagination::PageQuery};
use julink_proto::Page;

use crate::{
    models::{CallResponse, DirectCallRequest, GroupCallRequest},
    repo,
    state::CallsState,
};

pub fn router(state: CallsState) -> Router {
    Router::new()
        .route("/api/v1/calls/ping", get(ping))
        .route("/api/v1/calls/direct", post(create_direct))
        .route("/api/v1/calls/group", post(create_group))
        .route("/api/v1/calls/{call_id}/accept", post(accept))
        .route("/api/v1/calls/{call_id}/decline", post(decline))
        .route("/api/v1/calls/{call_id}/cancel", post(cancel))
        .route("/api/v1/calls/{call_id}/end", post(end))
        .route("/api/v1/calls/active", get(active))
        .route("/api/v1/calls/history", get(history))
        .with_state(state)
}

async fn ping() -> Json<serde_json::Value> {
    Json(json!({ "service": "calls", "status": "ok" }))
}

async fn create_direct(
    State(state): State<CallsState>,
    user: CurrentUser,
    Json(request): Json<DirectCallRequest>,
) -> Result<(StatusCode, Json<CallResponse>), AppError> {
    let target = state
        .identity
        .user_by_username(&request.target_username)
        .await?;
    if target.user_id == user.user_id {
        return Err(AppError::BadRequest("you cannot call yourself".to_string()));
    }

    let call_type = repo::normalize_call_type(request.call_type.as_deref())?;
    let call = repo::create_direct(
        &state.db,
        user.user_id,
        &user.username,
        target.user_id,
        &target.username,
        &call_type,
        &state.config.jitsi_base_url,
    )
    .await?;

    publish(&state, "session.created", &call).await;
    Ok((StatusCode::CREATED, Json(call)))
}

async fn create_group(
    State(state): State<CallsState>,
    user: CurrentUser,
    Json(request): Json<GroupCallRequest>,
) -> Result<(StatusCode, Json<CallResponse>), AppError> {
    let members = state.messaging.members(request.conversation_id).await?;
    if !members.iter().any(|member| member.user_id == user.user_id) {
        return Err(AppError::Forbidden);
    }

    let call_type = repo::normalize_call_type(request.call_type.as_deref())?;
    let participants: Vec<(Uuid, String)> = members
        .into_iter()
        .map(|member| (member.user_id, member.username))
        .collect();

    let call = repo::create_group(
        &state.db,
        user.user_id,
        request.conversation_id,
        &participants,
        &call_type,
        &state.config.jitsi_base_url,
    )
    .await?;

    publish(&state, "session.created", &call).await;
    Ok((StatusCode::CREATED, Json(call)))
}

async fn accept(
    State(state): State<CallsState>,
    user: CurrentUser,
    Path(call_id): Path<Uuid>,
) -> Result<Json<CallResponse>, AppError> {
    let call = repo::accept(&state.db, user.user_id, call_id).await?;
    publish(&state, "session.updated", &call).await;
    Ok(Json(call))
}

async fn decline(
    State(state): State<CallsState>,
    user: CurrentUser,
    Path(call_id): Path<Uuid>,
) -> Result<Json<CallResponse>, AppError> {
    let call = repo::decline(&state.db, user.user_id, call_id).await?;
    publish(&state, "session.updated", &call).await;
    Ok(Json(call))
}

async fn cancel(
    State(state): State<CallsState>,
    user: CurrentUser,
    Path(call_id): Path<Uuid>,
) -> Result<Json<CallResponse>, AppError> {
    let call = repo::cancel(&state.db, user.user_id, call_id).await?;
    publish(&state, "session.updated", &call).await;
    Ok(Json(call))
}

async fn end(
    State(state): State<CallsState>,
    user: CurrentUser,
    Path(call_id): Path<Uuid>,
) -> Result<Json<CallResponse>, AppError> {
    let call = repo::end(&state.db, user.user_id, call_id).await?;
    publish(&state, "session.updated", &call).await;
    Ok(Json(call))
}

async fn active(
    State(state): State<CallsState>,
    user: CurrentUser,
) -> Result<Json<Vec<CallResponse>>, AppError> {
    Ok(Json(repo::active_calls(&state.db, user.user_id).await?))
}

async fn history(
    State(state): State<CallsState>,
    user: CurrentUser,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<CallResponse>>, AppError> {
    let cursor = parse_cursor(&query)?;
    Ok(Json(
        repo::history(&state.db, user.user_id, cursor, query.limit()).await?,
    ))
}

async fn publish(state: &CallsState, event: &str, call: &CallResponse) {
    let Some(nats) = &state.nats else {
        return;
    };

    let participant_ids: Vec<String> = call
        .participants
        .iter()
        .map(|participant| participant.user_id.to_string())
        .collect();

    let payload = json!({
        "type": event,
        "call": call,
        "participant_ids": participant_ids,
    });

    if let Err(error) = nats
        .publish(format!("calls.{event}.v1"), payload.to_string().into())
        .await
    {
        tracing::warn!(%error, %event, "could not publish call event");
    }
}

fn parse_cursor(query: &PageQuery) -> Result<Option<Uuid>, AppError> {
    match query.cursor.as_deref() {
        Some(value) if !value.is_empty() => Uuid::parse_str(value)
            .map(Some)
            .map_err(|_| AppError::BadRequest("invalid cursor".to_string())),
        _ => Ok(None),
    }
}

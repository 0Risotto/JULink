use axum::{
    Json, Router,
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, patch, post},
};
use serde::Serialize;
use uuid::Uuid;

use julink_common::{AppError, auth::CurrentUser, pagination::PageQuery};
use julink_proto::Page;

use crate::{
    models::{
        AddMembersRequest, ConversationResponse, CreateDmRequest, CreateGroupRequest,
        EditMessageRequest, MarkReadRequest, Member, MessageResponse, SendMessageRequest,
        SetAdminRequest, UpdateGroupRequest,
    },
    repo,
    state::MessagingState,
};

#[derive(Debug, Serialize)]
struct IsMemberResponse {
    member: bool,
}

pub fn router(state: MessagingState) -> Router {
    Router::new()
        .route("/api/v1/chat/ping", get(ping))
        .route("/api/v1/chat/conversations", get(list_conversations))
        .route("/api/v1/chat/conversations/dm", post(create_dm))
        .route("/api/v1/chat/conversations/group", post(create_group))
        .route(
            "/api/v1/chat/conversations/{conversation_id}",
            get(get_conversation),
        )
        .route(
            "/api/v1/chat/conversations/{conversation_id}/group",
            patch(update_group),
        )
        .route(
            "/api/v1/chat/conversations/{conversation_id}/members",
            post(add_members),
        )
        .route(
            "/api/v1/chat/conversations/{conversation_id}/members/{username}",
            axum::routing::delete(remove_member),
        )
        .route(
            "/api/v1/chat/conversations/{conversation_id}/members/{username}/admin",
            patch(set_admin),
        )
        .route(
            "/api/v1/chat/conversations/{conversation_id}/leave",
            post(leave),
        )
        .route(
            "/api/v1/chat/conversations/{conversation_id}/messages",
            get(list_messages).post(send_message),
        )
        .route(
            "/api/v1/chat/conversations/{conversation_id}/read",
            post(mark_read),
        )
        .route(
            "/api/v1/chat/messages/{message_id}",
            patch(edit_message).delete(delete_message),
        )
        .route(
            "/internal/conversations/{conversation_id}/is-member/{user_id}",
            get(internal_is_member),
        )
        .route(
            "/internal/conversations/{conversation_id}/members",
            get(internal_members),
        )
        .route(
            "/internal/conversations/{conversation_id}/messages",
            post(internal_send_message),
        )
        .route(
            "/internal/conversations/{conversation_id}/read",
            post(internal_mark_read),
        )
        .with_state(state)
}

async fn ping() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "service": "messaging", "status": "ok" }))
}

async fn list_conversations(
    State(state): State<MessagingState>,
    user: CurrentUser,
) -> Result<Json<Vec<ConversationResponse>>, AppError> {
    Ok(Json(
        repo::list_conversations(&state.db, user.user_id).await?,
    ))
}

async fn create_dm(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Json(request): Json<CreateDmRequest>,
) -> Result<(StatusCode, Json<ConversationResponse>), AppError> {
    let conversation = repo::create_dm(
        &state.db,
        &state.identity,
        user.user_id,
        &user.username,
        &request.target_username,
    )
    .await?;
    Ok((StatusCode::CREATED, Json(conversation)))
}

async fn create_group(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Json(request): Json<CreateGroupRequest>,
) -> Result<(StatusCode, Json<ConversationResponse>), AppError> {
    let conversation = repo::create_group(
        &state.db,
        &state.identity,
        user.user_id,
        &user.username,
        &request.title,
        &request.member_usernames,
        request.avatar_url.as_deref(),
    )
    .await?;
    Ok((StatusCode::CREATED, Json(conversation)))
}

async fn get_conversation(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(conversation_id): Path<Uuid>,
) -> Result<Json<ConversationResponse>, AppError> {
    Ok(Json(
        repo::get_conversation(&state.db, user.user_id, conversation_id).await?,
    ))
}

async fn update_group(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(conversation_id): Path<Uuid>,
    Json(request): Json<UpdateGroupRequest>,
) -> Result<Json<ConversationResponse>, AppError> {
    Ok(Json(
        repo::update_group(&state.db, user.user_id, conversation_id, &request).await?,
    ))
}

async fn add_members(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(conversation_id): Path<Uuid>,
    Json(request): Json<AddMembersRequest>,
) -> Result<Json<ConversationResponse>, AppError> {
    Ok(Json(
        repo::add_members(
            &state.db,
            &state.identity,
            user.user_id,
            conversation_id,
            &request.usernames,
        )
        .await?,
    ))
}

async fn remove_member(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path((conversation_id, username)): Path<(Uuid, String)>,
) -> Result<Json<ConversationResponse>, AppError> {
    Ok(Json(
        repo::remove_member(
            &state.db,
            &state.identity,
            user.user_id,
            conversation_id,
            &username,
        )
        .await?,
    ))
}

async fn leave(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(conversation_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    repo::leave(&state.db, user.user_id, conversation_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn set_admin(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path((conversation_id, username)): Path<(Uuid, String)>,
    Json(request): Json<SetAdminRequest>,
) -> Result<Json<ConversationResponse>, AppError> {
    Ok(Json(
        repo::set_admin(
            &state.db,
            &state.identity,
            user.user_id,
            conversation_id,
            &username,
            request.admin,
        )
        .await?,
    ))
}

async fn list_messages(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(conversation_id): Path<Uuid>,
    Query(query): Query<PageQuery>,
) -> Result<Json<Page<MessageResponse>>, AppError> {
    let cursor = parse_cursor(&query)?;
    Ok(Json(
        repo::list_messages(
            &state.db,
            user.user_id,
            conversation_id,
            cursor,
            query.limit(),
        )
        .await?,
    ))
}

async fn send_message(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(conversation_id): Path<Uuid>,
    Json(request): Json<SendMessageRequest>,
) -> Result<(StatusCode, Json<MessageResponse>), AppError> {
    let message = repo::send_message(
        &state.db,
        user.user_id,
        &user.username,
        conversation_id,
        &request,
    )
    .await?;
    Ok((StatusCode::CREATED, Json(message)))
}

async fn edit_message(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(message_id): Path<Uuid>,
    Json(request): Json<EditMessageRequest>,
) -> Result<Json<MessageResponse>, AppError> {
    Ok(Json(
        repo::edit_message(&state.db, user.user_id, message_id, &request).await?,
    ))
}

async fn delete_message(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(message_id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    repo::delete_message(&state.db, user.user_id, message_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn mark_read(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(conversation_id): Path<Uuid>,
    Json(request): Json<MarkReadRequest>,
) -> Result<StatusCode, AppError> {
    repo::mark_read(
        &state.db,
        user.user_id,
        &user.username,
        conversation_id,
        &request,
    )
    .await?;
    Ok(StatusCode::NO_CONTENT)
}

async fn internal_is_member(
    State(state): State<MessagingState>,
    Path((conversation_id, user_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<IsMemberResponse>, AppError> {
    Ok(Json(IsMemberResponse {
        member: repo::is_member(&state.db, conversation_id, user_id).await?,
    }))
}

async fn internal_members(
    State(state): State<MessagingState>,
    Path(conversation_id): Path<Uuid>,
) -> Result<Json<Vec<Member>>, AppError> {
    Ok(Json(repo::members(&state.db, conversation_id).await?))
}

async fn internal_send_message(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(conversation_id): Path<Uuid>,
    Json(request): Json<SendMessageRequest>,
) -> Result<(StatusCode, Json<MessageResponse>), AppError> {
    send_message(State(state), user, Path(conversation_id), Json(request)).await
}

async fn internal_mark_read(
    State(state): State<MessagingState>,
    user: CurrentUser,
    Path(conversation_id): Path<Uuid>,
    Json(request): Json<MarkReadRequest>,
) -> Result<StatusCode, AppError> {
    mark_read(State(state), user, Path(conversation_id), Json(request)).await
}

fn parse_cursor(query: &PageQuery) -> Result<Option<Uuid>, AppError> {
    match query.cursor.as_deref() {
        Some(value) if !value.is_empty() => Uuid::parse_str(value)
            .map(Some)
            .map_err(|_| AppError::BadRequest("invalid cursor".to_string())),
        _ => Ok(None),
    }
}

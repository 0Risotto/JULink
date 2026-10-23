use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct Member {
    pub user_id: Uuid,
    pub username: String,
    pub role: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MessageResponse {
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub sender_username: String,
    pub kind: String,
    pub body: Option<String>,
    pub media_url: Option<String>,
    pub shared_post_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub edited_at: Option<DateTime<Utc>>,
    pub deleted: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ConversationResponse {
    pub id: Uuid,
    pub kind: String,
    pub title: Option<String>,
    pub avatar_url: Option<String>,
    pub created_by: Uuid,
    pub members: Vec<Member>,
    pub last_message: Option<MessageResponse>,
    pub unread_count: i64,
    pub created_at: DateTime<Utc>,
    pub last_message_at: Option<DateTime<Utc>>,
}

#[derive(Debug, sqlx::FromRow)]
pub struct ConversationRow {
    pub id: Uuid,
    pub kind: String,
    pub title: Option<String>,
    pub avatar_url: Option<String>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub last_message_at: Option<DateTime<Utc>>,
}

#[derive(Debug, sqlx::FromRow)]
pub struct MemberRow {
    pub conversation_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub role: String,
}

#[derive(Debug, sqlx::FromRow)]
pub struct MessageRow {
    pub id: Uuid,
    pub conversation_id: Uuid,
    pub sender_id: Uuid,
    pub sender_username: String,
    pub kind: String,
    pub body: Option<String>,
    pub media_url: Option<String>,
    pub shared_post_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub edited_at: Option<DateTime<Utc>>,
    pub deleted_at: Option<DateTime<Utc>>,
}

impl From<MessageRow> for MessageResponse {
    fn from(row: MessageRow) -> Self {
        Self {
            id: row.id,
            conversation_id: row.conversation_id,
            sender_id: row.sender_id,
            sender_username: row.sender_username,
            kind: row.kind,
            body: row.body,
            media_url: row.media_url,
            shared_post_id: row.shared_post_id,
            created_at: row.created_at,
            edited_at: row.edited_at,
            deleted: row.deleted_at.is_some(),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateDmRequest {
    pub target_username: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateGroupRequest {
    pub title: String,
    #[serde(default)]
    pub member_usernames: Vec<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateGroupRequest {
    pub title: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddMembersRequest {
    pub usernames: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub kind: Option<String>,
    pub body: Option<String>,
    pub media_url: Option<String>,
    pub shared_post_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct EditMessageRequest {
    pub body: String,
}

#[derive(Debug, Deserialize)]
pub struct MarkReadRequest {
    pub message_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct SetAdminRequest {
    pub admin: bool,
}

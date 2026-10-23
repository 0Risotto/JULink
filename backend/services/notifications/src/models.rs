use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct NotificationView {
    pub id: Uuid,
    pub recipient_id: Uuid,
    pub actor_id: Option<Uuid>,
    pub actor_username: Option<String>,
    pub kind: String,
    pub message: String,
    pub target_type: String,
    pub target_id: String,
    pub metadata_json: Option<String>,
    pub read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, sqlx::FromRow)]
pub struct NotificationRow {
    pub id: Uuid,
    pub recipient_id: Uuid,
    pub actor_id: Option<Uuid>,
    pub actor_username: Option<String>,
    pub kind: String,
    pub message: String,
    pub target_type: String,
    pub target_id: String,
    pub metadata_json: Option<String>,
    pub read_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

impl From<NotificationRow> for NotificationView {
    fn from(row: NotificationRow) -> Self {
        Self {
            id: row.id,
            recipient_id: row.recipient_id,
            actor_id: row.actor_id,
            actor_username: row.actor_username,
            kind: row.kind,
            message: row.message,
            target_type: row.target_type,
            target_id: row.target_id,
            metadata_json: row.metadata_json,
            read: row.read_at.is_some(),
            created_at: row.created_at,
        }
    }
}

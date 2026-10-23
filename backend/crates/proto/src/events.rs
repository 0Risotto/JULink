use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub const SUBJECT_USER_CREATED: &str = "identity.user.created.v1";
pub const SUBJECT_USER_UPDATED: &str = "identity.user.updated.v1";
pub const SUBJECT_USER_DELETED: &str = "identity.user.deleted.v1";

/// Envelope carried by every JetStream message.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EventEnvelope<T> {
    pub id: Uuid,
    pub kind: String,
    pub occurred_at: DateTime<Utc>,
    pub payload: T,
}

impl<T> EventEnvelope<T> {
    pub fn new(kind: impl Into<String>, payload: T) -> Self {
        Self {
            id: Uuid::now_v7(),
            kind: kind.into(),
            occurred_at: Utc::now(),
            payload,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserChanged {
    pub user_id: Uuid,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
}

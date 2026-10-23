use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct CallParticipant {
    pub user_id: Uuid,
    pub username: String,
    pub role: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct CallResponse {
    pub id: Uuid,
    pub room_name: String,
    pub jitsi_url: String,
    pub call_type: String,
    pub scope: String,
    pub status: String,
    pub created_by: Uuid,
    pub conversation_id: Option<Uuid>,
    pub participants: Vec<CallParticipant>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
}

#[derive(Debug, sqlx::FromRow)]
pub struct CallRow {
    pub id: Uuid,
    pub room_name: String,
    pub jitsi_url: String,
    pub call_type: String,
    pub scope: String,
    pub status: String,
    pub created_by: Uuid,
    pub conversation_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub ended_at: Option<DateTime<Utc>>,
}

#[derive(Debug, sqlx::FromRow)]
pub struct ParticipantRow {
    pub call_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub role: String,
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct DirectCallRequest {
    pub target_username: String,
    pub call_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GroupCallRequest {
    pub conversation_id: Uuid,
    pub call_type: Option<String>,
}

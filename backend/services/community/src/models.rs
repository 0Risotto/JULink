use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct LostAndFoundView {
    pub id: Uuid,
    pub owner_id: Uuid,
    pub owner_username: String,
    pub description: String,
    pub college: String,
    pub image_url: Option<String>,
    pub phone_number: Option<String>,
    pub kind: String,
    pub is_resolved: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLostAndFoundRequest {
    pub description: String,
    pub college: String,
    pub image_url: Option<String>,
    pub phone_number: Option<String>,
    #[serde(rename = "type")]
    pub kind: String,
}

#[derive(Debug, Deserialize)]
pub struct ClaimRequest {
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub college: Option<String>,
    #[serde(rename = "type")]
    pub kind: Option<String>,
    pub is_resolved: Option<bool>,
    pub cursor: Option<Uuid>,
    pub limit: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct CreateReportRequest {
    pub target_type: String,
    pub target_id: String,
    pub message: String,
}

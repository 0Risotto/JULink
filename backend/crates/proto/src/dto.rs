use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A public projection of a user, safe to cache or embed in feeds.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct UserSummary {
    pub id: Uuid,
    pub username: String,
    pub display_name: String,
    pub avatar_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaView {
    pub kind: String,
    pub url: String,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub duration_seconds: Option<i32>,
    pub position: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostView {
    pub id: Uuid,
    pub author_id: Uuid,
    pub author_username: String,
    pub body: String,
    pub media: Vec<MediaView>,
    pub hashtags: Vec<String>,
    pub like_count: i32,
    pub comment_count: i32,
    pub favorite_count: i32,
    pub impression_count: i32,
    pub liked: bool,
    pub favorited: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

/// Cursor-paginated response envelope.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Page<T> {
    pub items: Vec<T>,
    pub next_cursor: Option<String>,
}

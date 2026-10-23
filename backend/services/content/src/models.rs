use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, sqlx::FromRow)]
pub struct PostRow {
    pub id: Uuid,
    pub author_id: Uuid,
    pub author_username: String,
    pub body: String,
    pub like_count: i32,
    pub comment_count: i32,
    pub favorite_count: i32,
    pub impression_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub liked: bool,
    pub favorited: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct MediaResponse {
    pub kind: String,
    pub url: String,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub duration_seconds: Option<i32>,
    pub position: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct PostResponse {
    pub id: Uuid,
    pub author_id: Uuid,
    pub author_username: String,
    pub body: String,
    pub media: Vec<MediaResponse>,
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

#[derive(Debug, sqlx::FromRow)]
pub struct CommentRow {
    pub id: Uuid,
    pub post_id: Uuid,
    pub author_id: Uuid,
    pub author_username: String,
    pub body: String,
    pub parent_id: Option<Uuid>,
    pub like_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
    pub liked: bool,
    pub reply_count: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct CommentResponse {
    pub id: Uuid,
    pub post_id: Uuid,
    pub author_id: Uuid,
    pub author_username: String,
    pub body: String,
    pub parent_id: Option<Uuid>,
    pub like_count: i32,
    pub reply_count: i64,
    pub liked: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: Option<DateTime<Utc>>,
}

impl From<CommentRow> for CommentResponse {
    fn from(row: CommentRow) -> Self {
        Self {
            id: row.id,
            post_id: row.post_id,
            author_id: row.author_id,
            author_username: row.author_username,
            body: row.body,
            parent_id: row.parent_id,
            like_count: row.like_count,
            reply_count: row.reply_count,
            liked: row.liked,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
    }
}

#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct TrendingHashtag {
    pub name: String,
    pub post_count: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct LikeResponse {
    pub liked: bool,
    pub like_count: i32,
}

#[derive(Debug, Clone, Serialize)]
pub struct FavoriteResponse {
    pub favorited: bool,
    pub favorite_count: i32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct MediaInput {
    pub kind: String,
    pub url: String,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub duration_seconds: Option<i32>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePostRequest {
    #[serde(default)]
    pub body: String,
    #[serde(default)]
    pub media: Vec<MediaInput>,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePostRequest {
    #[serde(default)]
    pub body: String,
    #[serde(default)]
    pub media: Vec<MediaInput>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCommentRequest {
    pub body: String,
    pub parent_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCommentRequest {
    pub body: String,
}

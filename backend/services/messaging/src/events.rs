use serde_json::Value;
use sqlx::{Postgres, Transaction};

use julink_common::AppError;

pub const MESSAGE_CREATED: &str = "message.created";
pub const MESSAGE_UPDATED: &str = "message.updated";
pub const MESSAGE_DELETED: &str = "message.deleted";
pub const CONVERSATION_CREATED: &str = "conversation.created";
pub const CONVERSATION_UPDATED: &str = "conversation.updated";
pub const MEMBERS_ADDED: &str = "members.added";
pub const MEMBER_REMOVED: &str = "member.removed";
pub const READ_UPDATED: &str = "read.updated";

pub async fn record(
    tx: &mut Transaction<'_, Postgres>,
    event_type: &str,
    payload: Value,
) -> Result<(), AppError> {
    sqlx::query("INSERT INTO outbox (event_type, payload) VALUES ($1, $2)")
        .bind(event_type)
        .bind(sqlx::types::Json(payload))
        .execute(&mut **tx)
        .await?;
    Ok(())
}

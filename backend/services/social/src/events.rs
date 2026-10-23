use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use julink_common::AppError;

pub const FOLLOW_CREATED: &str = "follow.created";
pub const FOLLOW_DELETED: &str = "follow.deleted";
pub const BLOCK_CREATED: &str = "block.created";
pub const BLOCK_DELETED: &str = "block.deleted";

/// Append an event to the transactional outbox. The relay publishes it to
/// NATS after the graph mutation has succeeded.
pub async fn record_graph_event(
    db: Option<&PgPool>,
    event_type: &str,
    actor_id: Uuid,
    actor_username: &str,
    target_id: Uuid,
    target_username: &str,
) -> Result<(), AppError> {
    let Some(db) = db else {
        return Ok(());
    };

    let payload = json!({
        "actor_id": actor_id,
        "actor_username": actor_username,
        "target_id": target_id,
        "target_username": target_username,
    });

    sqlx::query("INSERT INTO outbox (event_type, payload) VALUES ($1, $2)")
        .bind(event_type)
        .bind(sqlx::types::Json(payload))
        .execute(db)
        .await?;

    Ok(())
}
